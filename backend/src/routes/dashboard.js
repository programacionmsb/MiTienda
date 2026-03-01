const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'empleado'), getDashboard);

module.exports = router;
