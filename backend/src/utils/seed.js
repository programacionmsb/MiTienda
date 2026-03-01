require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Conectado a MongoDB');

  // Limpiar
  await User.deleteMany({});
  await Product.deleteMany({});

  // Usuarios
  await User.create([
    { nombre: 'Admin Principal', email: 'admin@mitienda.com', password: 'admin123', rol: 'admin' },
    { nombre: 'Carlos Empleado', email: 'carlos@mitienda.com', password: 'emp123', rol: 'empleado' },
    { nombre: 'María Cliente', email: 'maria@gmail.com', password: 'cli123', rol: 'cliente', puntos: 432 },
  ]);

  // Productos
  await Product.create([
    { nombre: 'Coca-Cola 600ml', categoria: 'bebidas', precio: 3.00, costo: 1.80, stock: 48, emoji: '🥤', destacado: true },
    { nombre: 'Inca Kola 600ml', categoria: 'bebidas', precio: 3.00, costo: 1.80, stock: 36, emoji: '🥤' },
    { nombre: 'Agua San Mateo 500ml', categoria: 'bebidas', precio: 1.80, costo: 0.90, stock: 5, stockMinimo: 10, emoji: '💧' },
    { nombre: 'Jugo Pulp 250ml', categoria: 'bebidas', precio: 2.20, costo: 1.10, stock: 61, emoji: '🧃' },
    { nombre: 'Chocolate Sublime', categoria: 'golosinas', precio: 1.50, costo: 0.70, stock: 8, stockMinimo: 10, emoji: '🍫' },
    { nombre: 'Galletas Oreo', categoria: 'golosinas', precio: 2.50, costo: 1.20, stock: 34, emoji: '🍬', destacado: true },
    { nombre: 'Chizitos', categoria: 'golosinas', precio: 1.00, costo: 0.45, stock: 50, emoji: '🍿' },
    { nombre: 'Fideos Don Vittorio 500g', categoria: 'abarrotes', precio: 4.50, costo: 2.80, stock: 22, emoji: '🍜' },
    { nombre: 'Arroz Costeño 1kg', categoria: 'abarrotes', precio: 5.50, costo: 3.50, stock: 15, emoji: '🍚' },
    { nombre: 'Sal Emsal 1kg', categoria: 'abarrotes', precio: 1.20, costo: 0.60, stock: 0, emoji: '🧂' },
    { nombre: 'Aceite Primor 1L', categoria: 'abarrotes', precio: 9.90, costo: 7.00, stock: 12, emoji: '🫙' },
    { nombre: 'Detergente Ariel 500g', categoria: 'limpieza', precio: 7.50, costo: 4.50, stock: 18, emoji: '🧼' },
  ]);

  console.log('🌱 Datos iniciales creados');
  console.log('\nUsuarios:');
  console.log('  admin@mitienda.com / admin123  → Admin');
  console.log('  carlos@mitienda.com / emp123   → Empleado');
  console.log('  maria@gmail.com / cli123       → Cliente');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
