const Sale = require('../models/Sale');
const Product = require('../models/Product');
const User = require('../models/User');

// POST /api/sales  — Registrar venta en caja
exports.createSale = async (req, res, next) => {
  try {
    const { items, metodoPago, montoPagado, clienteId, descuento = 0 } = req.body;

    // Validar y obtener productos
    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productoId);
      if (!product) return res.status(404).json({ error: `Producto ${item.productoId} no encontrado` });
      if (product.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para ${product.nombre}` });
      }
      const itemSubtotal = product.precio * item.cantidad;
      subtotal += itemSubtotal;
      saleItems.push({
        producto: product._id,
        nombre: product.nombre,
        precio: product.precio,
        cantidad: item.cantidad,
        subtotal: itemSubtotal,
      });
      // Descontar stock
      await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.cantidad } });
    }

    const total = subtotal - descuento;
    const puntos = Math.floor(total);   // 1 punto por cada sol

    const sale = await Sale.create({
      items: saleItems,
      subtotal,
      descuento,
      total,
      metodoPago,
      montoPagado,
      cajero: req.user._id,
      cliente: clienteId || null,
      puntosOtorgados: puntos,
    });

    // Sumar puntos al cliente si está registrado
    if (clienteId) {
      await User.findByIdAndUpdate(clienteId, {
        $inc: { puntos, totalCompras: total }
      });
    }

    await sale.populate('cajero', 'nombre');
    res.status(201).json({ success: true, data: sale });
  } catch (error) { next(error); }
};

// GET /api/sales
exports.getSales = async (req, res, next) => {
  try {
    const { desde, hasta, metodoPago, page = 1, limit = 30 } = req.query;
    const filter = {};
    if (desde || hasta) {
      filter.createdAt = {};
      if (desde) filter.createdAt.$gte = new Date(desde);
      if (hasta) filter.createdAt.$lte = new Date(hasta + 'T23:59:59');
    }
    if (metodoPago) filter.metodoPago = metodoPago;

    const sales = await Sale.find(filter)
      .populate('cajero', 'nombre')
      .populate('cliente', 'nombre email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Sale.countDocuments(filter);
    const totalVendido = sales.reduce((sum, s) => sum + s.total, 0);

    res.json({ success: true, data: sales, total, totalVendido });
  } catch (error) { next(error); }
};

// GET /api/sales/resumen  — Resumen del día
exports.resumenDia = async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);

    const [resumen] = await Sale.aggregate([
      { $match: { createdAt: { $gte: hoy, $lt: mañana } } },
      {
        $group: {
          _id: null,
          totalVentas: { $sum: '$total' },
          cantidadTickets: { $sum: 1 },
          ticketPromedio: { $avg: '$total' },
          porMetodo: {
            $push: { metodo: '$metodoPago', total: '$total' }
          }
        }
      }
    ]);

    // Ventas por hora
    const porHora = await Sale.aggregate([
      { $match: { createdAt: { $gte: hoy, $lt: mañana } } },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          total: { $sum: '$total' },
          cantidad: { $sum: 1 },
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: { resumen: resumen || {}, porHora } });
  } catch (error) { next(error); }
};
