const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Order = require('../models/Order');
const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');

// GET /api/reports/ventas/pdf
exports.ventasPDF = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filter = {};
    if (desde) filter.createdAt = { $gte: new Date(desde) };
    if (hasta) filter.createdAt = { ...filter.createdAt, $lte: new Date(hasta + 'T23:59:59') };

    const sales = await Sale.find(filter)
      .populate('cajero', 'nombre')
      .sort({ createdAt: -1 })
      .limit(500);

    const totalGeneral = sales.reduce((sum, s) => sum + s.total, 0);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-ventas-${Date.now()}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('MiTienda', 40, 40);
    doc.fontSize(12).font('Helvetica').fillColor('#666').text('Reporte de Ventas', 40, 68);
    doc.fontSize(10).text(`Generado: ${new Date().toLocaleString('es-PE')}`, 40, 85);
    if (desde || hasta) {
      doc.text(`Período: ${desde || 'inicio'} → ${hasta || 'hoy'}`, 40, 100);
    }

    doc.moveTo(40, 115).lineTo(555, 115).strokeColor('#e0e0e0').stroke();

    // Resumen
    doc.fontSize(10).fillColor('#000')
      .text(`Total ventas: ${sales.length}`, 40, 125)
      .text(`Ingreso total: S/ ${totalGeneral.toFixed(2)}`, 200, 125)
      .text(`Ticket promedio: S/ ${sales.length ? (totalGeneral / sales.length).toFixed(2) : '0.00'}`, 380, 125);

    doc.moveTo(40, 145).lineTo(555, 145).strokeColor('#e0e0e0').stroke();

    // Tabla headers
    let y = 155;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#333');
    doc.text('#', 40, y).text('Fecha', 65, y).text('Cajero', 185, y)
       .text('Método', 310, y).text('Items', 390, y).text('Total', 480, y);
    doc.moveTo(40, y + 14).lineTo(555, y + 14).strokeColor('#ddd').stroke();
    y += 20;

    doc.font('Helvetica').fontSize(9).fillColor('#000');
    for (const sale of sales) {
      if (y > 750) { doc.addPage(); y = 40; }
      const fecha = new Date(sale.createdAt).toLocaleDateString('es-PE');
      doc.text(String(sale.numero).padStart(4, '0'), 40, y)
         .text(fecha, 65, y)
         .text(sale.cajero?.nombre || '-', 185, y)
         .text(sale.metodoPago, 310, y)
         .text(String(sale.items?.length || 0), 390, y)
         .text(`S/ ${sale.total.toFixed(2)}`, 480, y);
      y += 18;
    }

    // Footer total
    doc.moveTo(40, y + 5).lineTo(555, y + 5).strokeColor('#333').lineWidth(1).stroke();
    doc.font('Helvetica-Bold').fontSize(10)
       .text(`TOTAL GENERAL: S/ ${totalGeneral.toFixed(2)}`, 380, y + 12);

    doc.end();
  } catch (error) { next(error); }
};

// GET /api/reports/ventas/excel
exports.ventasExcel = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;
    const filter = {};
    if (desde) filter.createdAt = { $gte: new Date(desde) };
    if (hasta) filter.createdAt = { ...filter.createdAt, $lte: new Date(hasta + 'T23:59:59') };

    const sales = await Sale.find(filter)
      .populate('cajero', 'nombre')
      .populate('cliente', 'nombre')
      .sort({ createdAt: -1 });

    const data = sales.map(s => ({
      'N° Venta': String(s.numero).padStart(4, '0'),
      'Fecha': new Date(s.createdAt).toLocaleDateString('es-PE'),
      'Hora': new Date(s.createdAt).toLocaleTimeString('es-PE'),
      'Cajero': s.cajero?.nombre || '-',
      'Cliente': s.cliente?.nombre || 'Anónimo',
      'Método Pago': s.metodoPago,
      'Subtotal (S/)': s.subtotal,
      'Descuento (S/)': s.descuento || 0,
      'Total (S/)': s.total,
      'N° Productos': s.items?.length || 0,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [10,12,10,20,20,15,14,14,12,14].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');

    // Hoja resumen
    const totalGeneral = sales.reduce((s, v) => s + v.total, 0);
    const resumen = [
      ['Reporte MiTienda'],
      ['Total ventas', sales.length],
      ['Ingreso total', `S/ ${totalGeneral.toFixed(2)}`],
      ['Ticket promedio', `S/ ${sales.length ? (totalGeneral / sales.length).toFixed(2) : '0.00'}`],
    ];
    const wsR = XLSX.utils.aoa_to_sheet(resumen);
    XLSX.utils.book_append_sheet(wb, wsR, 'Resumen');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ventas-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) { next(error); }
};

// GET /api/reports/inventario/excel
exports.inventarioExcel = async (req, res, next) => {
  try {
    const products = await Product.find({ activo: true }).sort({ categoria: 1, nombre: 1 });
    const data = products.map(p => ({
      'Producto': p.nombre,
      'Categoría': p.categoria,
      'Precio (S/)': p.precio,
      'Costo (S/)': p.costo || '-',
      'Stock': p.stock,
      'Stock Mínimo': p.stockMinimo,
      'Estado': p.estadoStock,
      'Unidad': p.unidad,
      'Valor Stock (S/)': (p.precio * p.stock).toFixed(2),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [25,12,12,12,8,12,10,10,14].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="inventario-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) { next(error); }
};
