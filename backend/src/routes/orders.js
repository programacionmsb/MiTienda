const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /api/orders
router.get('/', protect, async (req, res, next) => {
  try {
    const { estado, clienteId, page = 1, limit = 20 } = req.query;
    let filter = {};
    if (req.user.rol === 'cliente') {
      filter.cliente = req.user._id;
    } else {
      if (estado) filter.estado = estado;
      if (clienteId) filter.cliente = clienteId;
    }

    const orders = await Order.find(filter)
      .populate('cliente', 'nombre telefono')
      .populate('atendidoPor', 'nombre')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: orders, total });
  } catch (error) { next(error); }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('cliente', 'nombre email telefono')
      .populate('items.producto', 'nombre imagen');
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
});

// POST /api/orders — Crear pedido (cliente)
router.post('/', protect, async (req, res, next) => {
  try {
    const { items, metodoPago, tipoEntrega, direccion, notas, nombreCliente, telefono } = req.body;
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productoId);
      if (!product || !product.activo) return res.status(404).json({ error: `Producto no disponible` });
      if (product.stock < item.cantidad) return res.status(400).json({ error: `Stock insuficiente: ${product.nombre}` });
      const itemSubtotal = product.precio * item.cantidad;
      subtotal += itemSubtotal;
      orderItems.push({ producto: product._id, nombre: product.nombre, precio: product.precio, cantidad: item.cantidad, subtotal: itemSubtotal });
    }

    const order = await Order.create({
      cliente: req.user.rol === 'cliente' ? req.user._id : null,
      nombreCliente: nombreCliente || req.user.nombre,
      telefono,
      items: orderItems,
      subtotal,
      total: subtotal,
      metodoPago,
      tipoEntrega,
      direccion,
      notas,
      historialEstados: [{ estado: 'pendiente', usuario: req.user._id }],
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
});

// PATCH /api/orders/:id/estado — Cambiar estado (empleado/admin)
router.patch('/:id/estado', protect, authorize('admin', 'empleado'), async (req, res, next) => {
  try {
    const { estado } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });

    order.estado = estado;
    order.atendidoPor = req.user._id;
    order.historialEstados.push({ estado, usuario: req.user._id });

    // Si se entrega, descontar stock
    if (estado === 'entregado') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.producto, { $inc: { stock: -item.cantidad } });
      }
      if (order.cliente) {
        const puntos = Math.floor(order.total);
        await User.findByIdAndUpdate(order.cliente, { $inc: { puntos, totalCompras: order.total } });
        order.puntosOtorgados = puntos;
      }
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
});

module.exports = router;
