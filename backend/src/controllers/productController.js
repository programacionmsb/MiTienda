const Product = require('../models/Product');

// GET /api/products
exports.getProducts = async (req, res, next) => {
  try {
    const { categoria, search, stockBajo, page = 1, limit = 50, activo = true } = req.query;
    const filter = { activo: activo === 'true' };
    if (categoria) filter.categoria = categoria;
    if (stockBajo === 'true') filter.$expr = { $lte: ['$stock', '$stockMinimo'] };
    if (search) filter.$text = { $search: search };

    const products = await Product.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ categoria: 1, nombre: 1 });
    const total = await Product.countDocuments(filter);

    res.json({ success: true, data: products, total, page: parseInt(page) });
  } catch (error) { next(error); }
};

// GET /api/products/:id
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

// POST /api/products
exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

// PATCH /api/products/:id/stock  — Ajuste rápido de stock
exports.adjustStock = async (req, res, next) => {
  try {
    const { cantidad, tipo } = req.body; // tipo: 'entrada' | 'salida' | 'ajuste'
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    if (tipo === 'ajuste') {
      product.stock = cantidad;
    } else if (tipo === 'entrada') {
      product.stock += cantidad;
    } else if (tipo === 'salida') {
      if (product.stock < cantidad) return res.status(400).json({ error: 'Stock insuficiente' });
      product.stock -= cantidad;
    }
    await product.save();
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

// DELETE /api/products/:id (soft delete)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, { activo: false }, { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ success: true, message: 'Producto desactivado' });
  } catch (error) { next(error); }
};

// GET /api/products/alertas/stock
exports.stockAlertas = async (req, res, next) => {
  try {
    const bajos = await Product.find({
      activo: true,
      $expr: { $lte: ['$stock', '$stockMinimo'] }
    }).sort({ stock: 1 });
    res.json({ success: true, data: bajos, total: bajos.length });
  } catch (error) { next(error); }
};
