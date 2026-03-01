const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verificar token
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No autorizado - token requerido' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Autorizar por roles
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.rol)) {
    return res.status(403).json({
      error: `Acceso denegado. Roles permitidos: ${roles.join(', ')}`
    });
  }
  next();
};

module.exports = { protect, authorize };
