import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form.email, form.password);
      toast.success(`¡Bienvenido, ${data.user.nombre}!`);
      if (data.user.rol === 'cliente') navigate('/pedidos');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const fill = (email, password) => setForm({ email, password });

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0e0c', display: 'flex',
      alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 1rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.5rem', color: '#f5a623' }}>
            Mi<span style={{ color: '#f0ede8' }}>Tienda</span>
          </div>
          <p style={{ color: '#8a8680', marginTop: '0.5rem' }}>Inicia sesión para continuar</p>
        </div>

        <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 20, padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8a8680', marginBottom: '0.4rem' }}>Email</label>
              <input
                type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                required
                style={{
                  width: '100%', background: '#211f1c', border: '1px solid #2e2b27',
                  borderRadius: 12, padding: '0.75rem 1rem', color: '#f0ede8',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#8a8680', marginBottom: '0.4rem' }}>Contraseña</label>
              <input
                type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••" required
                style={{
                  width: '100%', background: '#211f1c', border: '1px solid #2e2b27',
                  borderRadius: 12, padding: '0.75rem 1rem', color: '#f0ede8',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              background: '#f5a623', color: '#0f0e0c', border: 'none', borderRadius: 12,
              padding: '0.85rem', fontWeight: 700, fontSize: '1rem',
              fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', marginTop: '0.5rem',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
          </form>

          {/* Accesos rápidos demo */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #2e2b27', paddingTop: '1.25rem' }}>
            <p style={{ fontSize: '0.78rem', color: '#8a8680', marginBottom: '0.75rem', textAlign: 'center' }}>Acceso rápido (demo)</p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[
                { label: '⚙️ Admin', email: 'admin@mitienda.com', pass: 'admin123' },
                { label: '👤 Empleado', email: 'carlos@mitienda.com', pass: 'emp123' },
                { label: '🛍️ Cliente', email: 'maria@gmail.com', pass: 'cli123' },
              ].map(({ label, email, pass }) => (
                <button key={label} onClick={() => fill(email, pass)} style={{
                  flex: 1, background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8,
                  padding: '0.4rem', color: '#f0ede8', fontSize: '0.72rem', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', color: '#8a8680', marginTop: '1.5rem', fontSize: '0.88rem' }}>
          ¿No tienes cuenta?{' '}
          <Link to="/register" style={{ color: '#f5a623', textDecoration: 'none', fontWeight: 600 }}>Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
