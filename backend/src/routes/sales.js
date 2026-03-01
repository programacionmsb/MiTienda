const express = require('express');
const router = express.Router();
const saleCtrl = require('../controllers/saleController');
const { protect, authorize } = require('../middleware/auth');

router.get('/',          protect, authorize('admin','empleado'), saleCtrl.getSales);
router.get('/resumen',   protect, authorize('admin','empleado'), saleCtrl.resumenDia);
router.get('/deudores',  protect, authorize('admin','empleado'), saleCtrl.getDeudores);
router.post('/',         protect, authorize('admin','empleado'), saleCtrl.createSale);
router.post('/cobro',    protect, authorize('admin','empleado'), saleCtrl.registrarCobro);

module.exports = router;