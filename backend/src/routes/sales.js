const express = require('express');
const router = express.Router();
const saleCtrl = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin','empleado'), saleCtrl.getSales);
router.get('/resumen', protect, authorize('admin','empleado'), saleCtrl.resumenDia);
router.post('/', protect, authorize('admin','empleado'), saleCtrl.createSale);

module.exports = router;