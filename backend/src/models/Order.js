const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  nombre: String,          // Snapshot al momento de venta
  precio: Number,
  cantidad: { type: Number, required: true, min: 1 },
  subtotal: Number,
}, { _id: false });

const orderSchema = new mongoose.Schema({
  numero: { type: Number, unique: true },        // #0001, #0002 ...
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  nombreCliente: String,                          // Para pedidos sin cuenta
  telefono: String,
  direccion: String,
  items: [itemSchema],
  subtotal: { type: Number, required: true },
  descuento: { type: Number, default: 0 },
  total: { type: Number, required: true },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'],
    required: true,
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptado', 'preparando', 'listo', 'entregado', 'cancelado'],
    default: 'pendiente',
  },
  tipoEntrega: {
    type: String,
    enum: ['delivery', 'recojo'],
    default: 'delivery',
  },
  notas: String,
  atendidoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  puntosOtorgados: { type: Number, default: 0 },
  historialEstados: [{
    estado: String,
    fecha: { type: Date, default: Date.now },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
}, {
  timestamps: true,
});

// Auto-incrementar número de pedido
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const last = await this.constructor.findOne({}, {}, { sort: { numero: -1 } });
    this.numero = last ? last.numero + 1 : 1;
    // Calcular subtotales de items
    this.items = this.items.map(item => ({
      ...item,
      subtotal: item.precio * item.cantidad,
    }));
  }
  next();
});

orderSchema.index({ estado: 1, createdAt: -1 });
orderSchema.index({ cliente: 1 });

module.exports = mongoose.model('Order', orderSchema);
