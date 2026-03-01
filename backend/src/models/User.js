const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,
    maxlength: [100, 'Nombre muy largo'],
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria'],
    minlength: [6, 'Mínimo 6 caracteres'],
    select: false,
  },
  rol: {
    type: String,
    enum: ['admin', 'empleado', 'cliente'],
    default: 'cliente',
  },
  activo: { type: Boolean, default: true },
  telefono: { type: String, trim: true },
  direccion: { type: String, trim: true },
  puntos: { type: Number, default: 0 },          // Fidelización
  totalCompras: { type: Number, default: 0 },
  deuda: { type: Number, default: 0 },           // Crédito pendiente de pago
}, {
  timestamps: true,
});

// Hash password antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Comparar passwords
userSchema.methods.compararPassword = async function (candidato) {
  return bcrypt.compare(candidato, this.password);
};

// Ocultar password en JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
