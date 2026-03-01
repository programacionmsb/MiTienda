const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', ctrl.getProducts);                                             // Público
router.get('/alertas/stock', protect, authorize('admin','empleado'), ctrl.stockAlertas);
router.get('/:id', ctrl.getProduct);
router.post('/', protect, authorize('admin'), ctrl.createProduct);
router.put('/:id', protect, authorize('admin'), ctrl.updateProduct);
router.patch('/:id/stock', protect, authorize('admin','empleado'), ctrl.adjustStock);
router.delete('/:id', protect, authorize('admin'), ctrl.deleteProduct);

module.exports = router;
