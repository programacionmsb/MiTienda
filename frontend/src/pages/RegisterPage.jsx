import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const inputStyle = {
  width: '100%', background: '#211f1c', border: '1px solid #2e2b27',
  borderRadius: 12, padding: '0.75rem 1rem', color: '#f0ede8',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', outline: 'none',
  boxSizing: 'border-box',
};
const labelStyle = { display: 'block', fontSize: '0.85rem', color: '#8a8680', marginBottom: '0.4rem' };

export default function RegisterPage() {
  const [form, setForm] = useState({
    nombre: '', email: '', password: '', confirmar: '',
    telefono: '', direccion: '',
  });
  const [showPass, setShowPass]     = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const { login } = useAuthStore();
  const navigate   = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({
        nombre:    form.nombre,
        email:     form.email,
        password:  form.password,
        telefono:  form.telefono || undefined,
        direccion: form.direccion || undefined,
      });
      // Auto-login tras registro
      await login(form.email, form.password);
      toast.success(`¡Bienvenido, ${form.nombre}!`);
      navigate('/tienda');
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const passMatch = form.confirmar && form.password === form.confirmar;
  const passMismatch = form.confirmar && form.password !== form.confirmar;

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0e0c',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif", padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '2.2rem', color: '#f5a623' }}>
            Mi<span style={{ color: '#f0ede8' }}>Tienda</span>
          </div>
          <p style={{ color: '#8a8680', marginTop: '0.4rem', fontSize: '0.9rem' }}>
            Creá tu cuenta para hacer pedidos
          </p>
        </div>

        <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 20, padding: '2rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Nombre */}
            <div>
              <label style={labelStyle}>Nombre completo *</label>
              <input
                value={form.nombre} onChange={e => set('nombre', e.target.value)}
                placeholder="Tu nombre" required style={inputStyle}
              />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="tu@email.com" required style={inputStyle}
              />
            </div>

            {/* Contraseña + confirmar */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={labelStyle}>Contraseña *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={e => set('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres" required minLength={6}
                    style={{ ...inputStyle, paddingRight: '2.5rem' }}
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#8a8680', padding: 2,
                  }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Confirmar *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConf ? 'text' : 'password'}
                    value={form.confirmar} onChange={e => set('confirmar', e.target.value)}
                    placeholder="Repetí la contraseña" required
                    style={{
                      ...inputStyle, paddingRight: '2.5rem',
                      borderColor: passMatch ? '#3ecf8e' : passMismatch ? '#e85d3a' : '#2e2b27',
                    }}
                  />
                  <button type="button" onClick={() => setShowConf(v => !v)} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#8a8680', padding: 2,
                  }}>
                    {showConf ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passMismatch && (
                  <p style={{ color: '#e85d3a', fontSize: '0.72rem', marginTop: '0.3rem' }}>Las contraseñas no coinciden</p>
                )}
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label style={labelStyle}>Teléfono <span style={{ color: '#5a5650' }}>(opcional)</span></label>
              <input
                value={form.telefono} onChange={e => set('telefono', e.target.value)}
                placeholder="Ej: 987 654 321" style={inputStyle}
              />
            </div>

            {/* Dirección */}
            <div>
              <label style={labelStyle}>Dirección <span style={{ color: '#5a5650' }}>(opcional)</span></label>
              <input
                value={form.direccion} onChange={e => set('direccion', e.target.value)}
                placeholder="Para agilizar tus pedidos de delivery" style={inputStyle}
              />
            </div>

            <button type="submit" disabled={loading || passMismatch} style={{
              background: loading || passMismatch ? '#2e2b27' : '#f5a623',
              color: loading || passMismatch ? '#8a8680' : '#0f0e0c',
              border: 'none', borderRadius: 12, padding: '0.85rem',
              fontWeight: 700, fontSize: '1rem', fontFamily: "'DM Sans', sans-serif",
              cursor: loading || passMismatch ? 'not-allowed' : 'pointer',
              marginTop: '0.25rem', transition: 'all 0.15s',
            }}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: '#8a8680', marginTop: '1.5rem', fontSize: '0.88rem' }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: '#f5a623', textDecoration: 'none', fontWeight: 600 }}>
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
