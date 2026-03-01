const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  nombre: String,
  precio: Number,
  cantidad: Number,
  subtotal: Number,
}, { _id: false });

const saleSchema = new mongoose.Schema({
  numero: { type: Number, unique: true },
  items: [saleItemSchema],
  subtotal: Number,
  descuento: { type: Number, default: 0 },
  total: { type: Number, required: true },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta', 'credito'],
    required: true,
  },
  montoPagado: Number,        // Para calcular vuelto en efectivo
  vuelto: Number,
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cajero: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  puntosOtorgados: { type: Number, default: 0 },
  orden: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Si viene de pedido
}, {
  timestamps: true,
});

saleSchema.pre('save', async function (next) {
  if (this.isNew) {
    const last = await this.constructor.findOne({}, {}, { sort: { numero: -1 } });
    this.numero = last ? last.numero + 1 : 1;
    if (this.metodoPago === 'efectivo' && this.montoPagado) {
      this.vuelto = Math.max(0, this.montoPagado - this.total);
    }
  }
  next();
});

saleSchema.index({ createdAt: -1 });
saleSchema.index({ cajero: 1, createdAt: -1 });

module.exports = mongoose.model('Sale', saleSchema);
