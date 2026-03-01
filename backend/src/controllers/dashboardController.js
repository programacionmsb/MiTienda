const Sale = require('../models/Sale');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /api/dashboard  — KPIs principales
exports.getDashboard = async (req, res, next) => {
  try {
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const mañana = new Date(hoy); mañana.setDate(mañana.getDate() + 1);
    const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
    const inicioSemana = new Date(hoy); inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      ventasHoy, ventasAyer, ventasSemana, ventasMes,
      pedidosPendientes, productosStockBajo, totalClientes,
      topProductos
    ] = await Promise.all([
      // Ventas hoy
      Sale.aggregate([
        { $match: { createdAt: { $gte: hoy, $lt: mañana } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      // Ventas ayer
      Sale.aggregate([
        { $match: { createdAt: { $gte: ayer, $lt: hoy } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      // Ventas semana
      Sale.aggregate([
        { $match: { createdAt: { $gte: inicioSemana } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Ventas mes
      Sale.aggregate([
        { $match: { createdAt: { $gte: inicioMes } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      // Pedidos pendientes
      Order.countDocuments({ estado: { $in: ['pendiente', 'aceptado', 'preparando'] } }),
      // Productos con stock bajo
      Product.countDocuments({ activo: true, $expr: { $lte: ['$stock', '$stockMinimo'] } }),
      // Clientes registrados
      User.countDocuments({ rol: 'cliente', activo: true }),
      // Top 5 productos más vendidos (este mes)
      Sale.aggregate([
        { $match: { createdAt: { $gte: inicioMes } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.nombre', totalVendido: { $sum: '$items.cantidad' }, ingresos: { $sum: '$items.subtotal' } } },
        { $sort: { totalVendido: -1 } },
        { $limit: 5 }
      ])
    ]);

    const vHoy = ventasHoy[0] || { total: 0, count: 0 };
    const vAyer = ventasAyer[0] || { total: 0, count: 0 };
    const crecimiento = vAyer.total > 0
      ? (((vHoy.total - vAyer.total) / vAyer.total) * 100).toFixed(1)
      : null;

    res.json({
      success: true,
      data: {
        ventasHoy: vHoy,
        ventasAyer: vAyer,
        crecimientoHoy: crecimiento,
        ventasSemana: ventasSemana[0]?.total || 0,
        ventasMes: ventasMes[0]?.total || 0,
        pedidosPendientes,
        productosStockBajo,
        totalClientes,
        topProductos,
      }
    });
  } catch (error) { next(error); }
};
