const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'Nombre obligatorio'],
    trim: true,
  },
  descripcion: { type: String, trim: true },
  categoria: {
    type: String,
    enum: ['bebidas', 'golosinas', 'abarrotes', 'panaderia', 'limpieza', 'otros'],
    required: true,
  },
  precio: {
    type: Number,
    required: [true, 'Precio obligatorio'],
    min: [0, 'Precio no puede ser negativo'],
  },
  costo: { type: Number, min: 0 },               // Para calcular margen
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Stock no puede ser negativo'],
  },
  stockMinimo: { type: Number, default: 5 },      // Alerta stock bajo
  unidad: {
    type: String,
    enum: ['unidad', 'kg', 'litro', 'paquete', 'caja'],
    default: 'unidad',
  },
  codigoBarras: { type: String, trim: true, sparse: true },
  imagen: { type: String },
  emoji: { type: String, default: '📦' },
  activo: { type: Boolean, default: true },
  destacado: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
});

// Virtual: estado del stock
productSchema.virtual('estadoStock').get(function () {
  if (this.stock === 0) return 'agotado';
  if (this.stock <= this.stockMinimo) return 'bajo';
  return 'ok';
});

// Virtual: margen de ganancia
productSchema.virtual('margen').get(function () {
  if (!this.costo || this.costo === 0) return null;
  return (((this.precio - this.costo) / this.precio) * 100).toFixed(1);
});

// Índices para búsqueda
productSchema.index({ nombre: 'text', descripcion: 'text' });
productSchema.index({ categoria: 1, activo: 1 });

module.exports = mongoose.model('Product', productSchema);
