import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Boxes, Receipt, ShoppingCart, FileBarChart, LogOut, Store, Star } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin','empleado'] },
  { to: '/productos', icon: Package, label: 'Productos', roles: ['admin','empleado','cliente'] },
  { to: '/inventario', icon: Boxes, label: 'Inventario', roles: ['admin','empleado'] },
  { to: '/ventas', icon: Receipt, label: 'Ventas', roles: ['admin','empleado'] },
  { to: '/pedidos', icon: ShoppingCart, label: 'Pedidos', roles: ['admin','empleado','cliente'] },
  { to: '/reportes', icon: FileBarChart, label: 'Reportes', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const visibleItems = navItems.filter(i => i.roles.includes(user?.rol));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0e0c', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: '#0f0e0c', borderRight: '1px solid #2e2b27',
        display: 'flex', flexDirection: 'column', padding: '1.5rem 0', position: 'fixed',
        height: '100vh', zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.4rem', color: '#f5a623' }}>
            Mi<span style={{ color: '#f0ede8' }}>Tienda</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8a8680', marginTop: '0.2rem' }}>
            {user?.rol === 'admin' ? '⚙️ Administrador' : user?.rol === 'empleado' ? '👤 Empleado' : '🛍️ Cliente'}
          </div>
        </div>

        {/* Links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0 0.75rem' }}>
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.75rem', borderRadius: '10px',
              textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
              transition: 'all 0.15s',
              background: isActive ? '#1a1916' : 'transparent',
              color: isActive ? '#f5a623' : '#8a8680',
              borderLeft: isActive ? '2px solid #f5a623' : '2px solid transparent',
            })}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info + acciones */}
        <div style={{ padding: '0 0.75rem', borderTop: '1px solid #2e2b27', paddingTop: '1rem' }}>
          {user?.rol === 'cliente' && (
            <div style={{ background: '#1a1916', borderRadius: 10, padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.82rem' }}>
              <div style={{ color: '#f5a623', fontWeight: 600 }}>⭐ {user.puntos || 0} puntos</div>
              <div style={{ color: '#8a8680', marginTop: '0.2rem' }}>Programa fidelidad</div>
            </div>
          )}
          <NavLink to="/tienda" style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 0.75rem', borderRadius: '10px', textDecoration: 'none',
            color: '#8a8680', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.25rem',
          }}>
            <Store size={18} /> Ver Tienda
          </NavLink>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 0.75rem', marginBottom: '0.5rem',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: '#f5a623',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700, color: '#0f0e0c', flexShrink: 0,
            }}>
              {user?.nombre?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f0ede8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nombre}</div>
              <div style={{ fontSize: '0.72rem', color: '#8a8680', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 0.75rem', borderRadius: '10px', border: 'none',
            background: 'transparent', color: '#8a8680', fontSize: '0.9rem', cursor: 'pointer',
          }}>
            <LogOut size={18} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh', color: '#f0ede8' }}>
        <Outlet />
      </main>
    </div>
  );
}
