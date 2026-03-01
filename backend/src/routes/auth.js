// routes/auth.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const ctrl = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', [
  body('nombre').notEmpty().trim(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
], ctrl.register);

router.post('/login', ctrl.login);
router.get('/me', protect, ctrl.getMe);
router.put('/profile', protect, ctrl.updateProfile);
router.get('/users',      protect, authorize('admin','empleado'), ctrl.getUsers);
router.post('/users',     protect, authorize('admin'),           ctrl.createUser);
router.patch('/users/:id', protect, authorize('admin'),          ctrl.updateUser);

module.exports = router;
