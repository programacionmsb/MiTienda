const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, email, password, telefono, direccion } = req.body;

    const existente = await User.findOne({ email });
    if (existente) return res.status(400).json({ error: 'Email ya registrado' });

    const user = await User.create({ nombre, email, password, telefono, direccion, rol: 'cliente' });
    const token = generateToken(user._id);

    res.status(201).json({ success: true, token, user });
  } catch (error) { next(error); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.activo)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const passwordOk = await user.compararPassword(password);
    if (!passwordOk)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = generateToken(user._id);
    res.json({ success: true, token, user });
  } catch (error) { next(error); }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { nombre, telefono, direccion } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { nombre, telefono, direccion },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) { next(error); }
};

// POST /api/auth/users  — Admin crea cliente manualmente
exports.createUser = async (req, res, next) => {
  try {
    const { nombre, email, password, telefono, direccion, rol = 'cliente' } = req.body;
    if (!nombre || !email || !password) return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
    const existente = await User.findOne({ email });
    if (existente) return res.status(400).json({ error: 'Email ya registrado' });
    const user = await User.create({ nombre, email, password, telefono, direccion, rol });
    res.status(201).json({ success: true, data: user });
  } catch (error) { next(error); }
};

// PATCH /api/auth/users/:id  — Admin edita cualquier usuario
exports.updateUser = async (req, res, next) => {
  try {
    const { nombre, telefono, direccion, puntos, activo } = req.body;
    const update = {};
    if (nombre    !== undefined) update.nombre    = nombre;
    if (telefono  !== undefined) update.telefono  = telefono;
    if (direccion !== undefined) update.direccion = direccion;
    if (puntos    !== undefined) update.puntos    = puntos;
    if (activo    !== undefined) update.activo    = activo;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ success: true, data: user });
  } catch (error) { next(error); }
};

// GET /api/auth/users (admin y empleado)
exports.getUsers = async (req, res, next) => {
  try {
    const { rol, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (rol) filter.rol = rol;
    if (search) filter.$or = [
      { nombre: { $regex: search, $options: 'i' } },
      { email:  { $regex: search, $options: 'i' } },
    ];
    const users = await User.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: users, total, page: parseInt(page) });
  } catch (error) { next(error); }
};
