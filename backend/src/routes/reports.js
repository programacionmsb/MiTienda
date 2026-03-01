// reports.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.get('/ventas/pdf', protect, authorize('admin'), ctrl.ventasPDF);
router.get('/ventas/excel', protect, authorize('admin'), ctrl.ventasExcel);
router.get('/inventario/excel', protect, authorize('admin', 'empleado'), ctrl.inventarioExcel);

module.exports = router;
