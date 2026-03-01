# 🛒 MiTienda — Sistema de Gestión Completo

Sistema full-stack para tienda de abarrotes, golosinas y bebidas.
Stack: **React + Node.js/Express + MongoDB**

---

## 📁 Estructura del Proyecto

```
mitienda/
├── backend/                  ← API REST (Node.js + Express)
│   └── src/
│       ├── index.js          ← Servidor principal
│       ├── config/
│       │   └── database.js   ← Conexión MongoDB
│       ├── models/
│       │   ├── User.js       ← Usuarios (admin/empleado/cliente)
│       │   ├── Product.js    ← Productos con control de stock
│       │   ├── Order.js      ← Pedidos online
│       │   └── Sale.js       ← Ventas en caja
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── productController.js
│       │   ├── saleController.js
│       │   ├── reportController.js  ← PDF + Excel
│       │   └── dashboardController.js
│       ├── routes/           ← Endpoints REST
│       ├── middleware/
│       │   ├── auth.js       ← JWT + roles
│       │   └── errorHandler.js
│       └── utils/
│           └── seed.js       ← Datos iniciales
│
└── frontend/                 ← React App
    └── src/
        ├── App.jsx           ← Router principal
        ├── services/
        │   └── api.js        ← Axios + todas las llamadas API
        ├── store/
        │   └── authStore.js  ← Zustand (estado global)
        ├── components/
        │   └── layout/
        │       └── Layout.jsx ← Sidebar + navegación
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx  ← KPIs + gráficas
            └── ReportsPage.jsx    ← Exportar PDF/Excel
```

---

## 🚀 Instalación y ejecución

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edita .env con tu MongoDB URI y JWT_SECRET
npm install
npm run seed    # Carga datos iniciales
npm run dev     # Corre en http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start       # Corre en http://localhost:3000
```

---

## 🔑 Usuarios de prueba (tras `npm run seed`)

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Admin | admin@mitienda.com | admin123 |
| Empleado | carlos@mitienda.com | emp123 |
| Cliente | maria@gmail.com | cli123 |

---

## 📡 API Reference

### Auth
| Método | Ruta | Acceso |
|--------|------|--------|
| POST | /api/auth/register | Público |
| POST | /api/auth/login | Público |
| GET | /api/auth/me | Autenticado |
| GET | /api/auth/users | Admin |

### Productos
| Método | Ruta | Acceso |
|--------|------|--------|
| GET | /api/products | Público |
| POST | /api/products | Admin |
| PUT | /api/products/:id | Admin |
| PATCH | /api/products/:id/stock | Admin, Empleado |
| GET | /api/products/alertas/stock | Admin, Empleado |

### Ventas
| Método | Ruta | Acceso |
|--------|------|--------|
| GET | /api/sales | Admin, Empleado |
| POST | /api/sales | Admin, Empleado |
| GET | /api/sales/resumen | Admin, Empleado |

### Pedidos
| Método | Ruta | Acceso |
|--------|------|--------|
| GET | /api/orders | Autenticado |
| POST | /api/orders | Autenticado |
| PATCH | /api/orders/:id/estado | Admin, Empleado |

### Dashboard
| Método | Ruta | Acceso |
|--------|------|--------|
| GET | /api/dashboard | Admin, Empleado |

### Reportes
| Método | Ruta | Acceso |
|--------|------|--------|
| GET | /api/reports/ventas/pdf | Admin |
| GET | /api/reports/ventas/excel | Admin |
| GET | /api/reports/inventario/excel | Admin, Empleado |

---

## 💳 Métodos de pago soportados
- 💵 Efectivo (calcula vuelto automáticamente)
- 📱 Yape
- 📱 Plin
- 🏦 Transferencia
- 💳 Tarjeta

## ⭐ Sistema de puntos
- 1 punto por cada S/ 1.00 comprado
- Puntos acumulables por clientes registrados
- Consulta de puntos en tiempo real

## 🔐 Seguridad
- JWT con expiración configurable
- Bcrypt para contraseñas
- Rate limiting (100 req/15min)
- Helmet para headers HTTP
- CORS configurado
- Soft delete para productos

---

## 🗺️ Próximos pasos sugeridos

1. **Completar páginas:** Inventario, Caja/Ventas, Pedidos, Tienda
2. **WebSockets:** Notificaciones de pedidos en tiempo real
3. **WhatsApp:** Integración con Twilio/Meta para pedidos
4. **PWA:** Hacer la app instalable en móvil
5. **Deploy:** Backend en Railway/Render, Frontend en Vercel
