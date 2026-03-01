// ProductsPage.jsx
export function ProductsPage() {
  return <div style={{ padding: '2rem', color: '#f0ede8' }}>
    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem' }}>Productos</h1>
    <p style={{ color: '#8a8680', marginTop: '0.5rem' }}>Catálogo de productos disponibles</p>
    <p style={{ color: '#8a8680', marginTop: '2rem', background: '#1a1916', borderRadius: 12, padding: '1rem' }}>
      🔧 Conectar con <code>GET /api/products</code> para listar productos con búsqueda y filtros por categoría.
    </p>
  </div>;
}

// InventoryPage.jsx
export function InventoryPage() {
  return <div style={{ padding: '2rem', color: '#f0ede8' }}>
    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem' }}>Inventario</h1>
    <p style={{ color: '#8a8680', marginTop: '0.5rem' }}>Control de stock en tiempo real</p>
    <p style={{ color: '#8a8680', marginTop: '2rem', background: '#1a1916', borderRadius: 12, padding: '1rem' }}>
      🔧 Conectar con <code>GET /api/products</code> y <code>PATCH /api/products/:id/stock</code>
    </p>
  </div>;
}

// SalesPage.jsx
export function SalesPage() {
  return <div style={{ padding: '2rem', color: '#f0ede8' }}>
    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem' }}>Caja / Ventas</h1>
    <p style={{ color: '#8a8680', marginTop: '0.5rem' }}>Registrar ventas y cobros</p>
    <p style={{ color: '#8a8680', marginTop: '2rem', background: '#1a1916', borderRadius: 12, padding: '1rem' }}>
      🔧 Conectar con <code>POST /api/sales</code> — soporta efectivo, Yape y Plin
    </p>
  </div>;
}

// OrdersPage.jsx
export function OrdersPage() {
  return <div style={{ padding: '2rem', color: '#f0ede8' }}>
    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem' }}>Pedidos</h1>
    <p style={{ color: '#8a8680', marginTop: '0.5rem' }}>Gestión de pedidos online</p>
    <p style={{ color: '#8a8680', marginTop: '2rem', background: '#1a1916', borderRadius: 12, padding: '1rem' }}>
      🔧 Conectar con <code>GET /api/orders</code> y <code>PATCH /api/orders/:id/estado</code>
    </p>
  </div>;
}

// StorePage.jsx
export function StorePage() {
  return <div style={{ padding: '2rem', color: '#f0ede8', background: '#0f0e0c', minHeight: '100vh' }}>
    <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem', color: '#f5a623' }}>MiTienda</h1>
    <p style={{ color: '#8a8680', marginTop: '0.5rem' }}>Tienda pública para clientes</p>
    <p style={{ color: '#8a8680', marginTop: '2rem', background: '#1a1916', borderRadius: 12, padding: '1rem' }}>
      🔧 Catálogo público — <code>GET /api/products</code> (sin autenticación)
    </p>
  </div>;
}

export function RegisterPage() {
  return <div style={{ minHeight: '100vh', background: '#0f0e0c', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0ede8' }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", color: '#f5a623' }}>Registro</h1>
      <p style={{ color: '#8a8680', marginTop: '0.5rem' }}>Formulario de registro de clientes</p>
      <p style={{ color: '#8a8680', marginTop: '1rem', fontSize: '0.85rem' }}>🔧 POST /api/auth/register</p>
    </div>
  </div>;
}
