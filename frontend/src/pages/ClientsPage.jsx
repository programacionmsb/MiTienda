import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Edit2, UserCheck, UserX, X, Users } from 'lucide-react';
import { authAPI, salesAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useIsMobile from '../hooks/useIsMobile';
import toast from 'react-hot-toast';

const S = (v) => `S/ ${(v || 0).toFixed(2)}`;

const input = {
  width: '100%', background: '#211f1c', border: '1px solid #2e2b27',
  borderRadius: 10, padding: '0.65rem 0.85rem', color: '#f0ede8',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem', outline: 'none',
  boxSizing: 'border-box',
};
const lbl = { display: 'block', fontSize: '0.8rem', color: '#8a8680', marginBottom: '0.35rem' };

const EMPTY_FORM = { nombre: '', email: '', password: '', telefono: '', direccion: '' };

// ── Modal crear / editar cliente ────────────────────────────────────────────
function ClientModal({ client, onClose, onSaved }) {
  const isEdit = !!client?._id;
  const [form, setForm] = useState(isEdit ? {
    nombre: client.nombre || '', telefono: client.telefono || '',
    direccion: client.direccion || '', puntos: client.puntos ?? 0,
  } : { ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await authAPI.updateUser(client._id, {
          nombre: form.nombre, telefono: form.telefono,
          direccion: form.direccion, puntos: parseInt(form.puntos, 10) || 0,
        });
        toast.success('Cliente actualizado');
      } else {
        if (!form.password || form.password.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres'); setSaving(false); return;
        }
        await authAPI.createUser({
          nombre: form.nombre, email: form.email,
          password: form.password, telefono: form.telefono,
          direccion: form.direccion, rol: 'cliente',
        });
        toast.success('Cliente creado');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.15rem', margin: 0 }}>
            {isEdit ? `Editar — ${client.nombre}` : 'Nuevo cliente'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8680' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={lbl}>Nombre completo *</label>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} required placeholder="Ej: Juan Pérez" style={input} />
          </div>

          {!isEdit && (
            <>
              <div>
                <label style={lbl}>Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="cliente@email.com" style={input} />
              </div>
              <div>
                <label style={lbl}>Contraseña *</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" style={input} />
              </div>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>Teléfono</label>
              <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="987 654 321" style={input} />
            </div>
            {isEdit && (
              <div>
                <label style={lbl}>Puntos fidelidad</label>
                <input type="number" min="0" value={form.puntos} onChange={e => set('puntos', e.target.value)} style={input} />
              </div>
            )}
          </div>

          <div>
            <label style={lbl}>Dirección</label>
            <input value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle, número, referencia" style={input} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10, padding: '0.75rem', color: '#8a8680', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ flex: 2, background: '#f5a623', border: 'none', borderRadius: 10, padding: '0.75rem', color: '#0f0e0c', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ────────────────────────────────────────────────────────
export default function ClientsPage() {
  const { user } = useAuthStore();
  const isAdmin  = user?.rol === 'admin';
  const isMobile = useIsMobile();

  const [clients, setClients]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filtro, setFiltro]     = useState('todos'); // todos | con_deuda | inactivos
  const [modal, setModal]       = useState(null);    // null | 'new' | client_obj

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { rol: 'cliente', limit: 100 };
      if (search) params.search = search;
      if (filtro === 'inactivos') params.activo = 'false';
      const res = await authAPI.getUsers(params);
      let data = res.data.data || [];
      if (filtro === 'con_deuda') data = data.filter(c => c.deuda > 0);
      setClients(data);
    } catch {
      toast.error('Error cargando clientes');
    } finally { setLoading(false); }
  }, [search, filtro]);

  useEffect(() => { load(); }, [load]);

  const toggleActivo = async (c) => {
    if (!window.confirm(`¿${c.activo ? 'Desactivar' : 'Activar'} a ${c.nombre}?`)) return;
    try {
      await authAPI.updateUser(c._id, { activo: !c.activo });
      toast.success(`Cliente ${c.activo ? 'desactivado' : 'activado'}`);
      load();
    } catch { toast.error('Error al cambiar estado'); }
  };

  // Stats
  const totalClients  = clients.length;
  const conDeuda      = clients.filter(c => c.deuda > 0).length;
  const totalDeuda    = clients.reduce((s, c) => s + (c.deuda || 0), 0);
  const totalPuntos   = clients.reduce((s, c) => s + (c.puntos || 0), 0);

  const fmtDate = (d) => new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: '2-digit' });

  const cell = { padding: '0.8rem 1rem', fontSize: '0.86rem' };

  return (
    <div style={{ padding: isMobile ? '1rem' : '2rem', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '1.5rem' : '1.8rem', margin: 0 }}>Clientes</h1>
          <p style={{ color: '#8a8680', marginTop: '0.25rem', fontSize: '0.9rem' }}>{totalClients} cliente{totalClients !== 1 ? 's' : ''} registrado{totalClients !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setModal('new')} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f5a623', border: 'none', borderRadius: 12,
            padding: '0.65rem 1.1rem', color: '#0f0e0c', fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
          }}>
            <Plus size={16} /> Nuevo cliente
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total',       value: totalClients,    color: '#f0ede8' },
          { label: 'Con deuda',   value: conDeuda,        color: conDeuda > 0 ? '#e85d3a' : '#3ecf8e' },
          { label: 'Deuda total', value: S(totalDeuda),   color: '#e85d3a' },
          { label: 'Puntos oted.', value: totalPuntos.toLocaleString(), color: '#f5a623' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 14, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{label}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '1.2rem' : '1.4rem', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#8a8680' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o email..."
            style={{ ...input, paddingLeft: '2.1rem' }} />
        </div>
        {['todos', 'con_deuda', 'inactivos'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            background: filtro === f ? '#f5a62320' : '#211f1c',
            border: `1px solid ${filtro === f ? '#f5a623' : '#2e2b27'}`,
            borderRadius: 10, padding: '0.55rem 0.9rem',
            color: filtro === f ? '#f5a623' : '#8a8680',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
            fontWeight: filtro === f ? 700 : 400, cursor: 'pointer',
          }}>
            {f === 'todos' ? 'Todos' : f === 'con_deuda' ? '📒 Con deuda' : '🚫 Inactivos'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>Cargando...</div>
        ) : clients.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>
            <Users size={40} style={{ marginBottom: '0.75rem', opacity: 0.25 }} />
            <div>No hay clientes</div>
          </div>
        ) : isMobile ? (
          /* Tarjetas mobile */
          <div>
            {clients.map((c, i) => (
              <div key={c._id} style={{ padding: '0.9rem 1rem', borderBottom: i < clients.length - 1 ? '1px solid #2e2b27' : 'none', opacity: c.activo ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5a62320', border: '1px solid #f5a62340', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#f5a623', flexShrink: 0, fontSize: '1rem' }}>
                      {c.nombre?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8a8680', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                      <button onClick={() => setModal(c)} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8, padding: '0.35rem 0.55rem', cursor: 'pointer', color: '#f0ede8' }}><Edit2 size={13} /></button>
                      <button onClick={() => toggleActivo(c)} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8, padding: '0.35rem 0.55rem', cursor: 'pointer', color: c.activo ? '#e85d3a' : '#3ecf8e' }}>
                        {c.activo ? <UserX size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.78rem' }}>
                  {c.telefono && <span style={{ color: '#8a8680' }}>📞 {c.telefono}</span>}
                  <span style={{ color: '#f5a623' }}>⭐ {c.puntos || 0} pts</span>
                  {c.deuda > 0 && <span style={{ color: '#e85d3a', fontWeight: 700 }}>📒 Debe {S(c.deuda)}</span>}
                  <span style={{ color: '#8a8680' }}>💰 {S(c.totalCompras)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Tabla desktop */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2b27' }}>
                  {['Cliente', 'Email', 'Teléfono', 'Compras', 'Puntos', 'Deuda', 'Registro', 'Estado', isAdmin ? 'Acciones' : ''].map(h => h && (
                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.73rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={c._id}
                    style={{ borderBottom: i < clients.length - 1 ? '1px solid #2e2b27' : 'none', transition: 'background 0.15s', opacity: c.activo ? 1 : 0.5 }}
                    onMouseEnter={e => e.currentTarget.style.background = '#211f1c'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={cell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f5a62320', border: '1px solid #f5a62340', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#f5a623', flexShrink: 0 }}>
                          {c.nombre?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{c.nombre}</span>
                      </div>
                    </td>
                    <td style={{ ...cell, color: '#8a8680' }}>{c.email}</td>
                    <td style={{ ...cell, color: '#8a8680' }}>{c.telefono || '—'}</td>
                    <td style={{ ...cell, color: '#f5a623', fontWeight: 600 }}>{S(c.totalCompras)}</td>
                    <td style={cell}>
                      <span style={{ background: '#f5a62315', color: '#f5a623', borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                        ⭐ {c.puntos || 0}
                      </span>
                    </td>
                    <td style={cell}>
                      {c.deuda > 0
                        ? <span style={{ color: '#e85d3a', fontWeight: 700 }}>{S(c.deuda)}</span>
                        : <span style={{ color: '#3ecf8e', fontSize: '0.82rem' }}>Al día</span>}
                    </td>
                    <td style={{ ...cell, color: '#8a8680', fontSize: '0.8rem' }}>{fmtDate(c.createdAt)}</td>
                    <td style={cell}>
                      <span style={{
                        background: c.activo ? '#3ecf8e15' : '#e85d3a15',
                        color: c.activo ? '#3ecf8e' : '#e85d3a',
                        borderRadius: 6, padding: '0.15rem 0.5rem', fontSize: '0.78rem', fontWeight: 600,
                      }}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td style={cell}>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button onClick={() => setModal(c)} title="Editar" style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#f0ede8' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => toggleActivo(c)} title={c.activo ? 'Desactivar' : 'Activar'} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: c.activo ? '#e85d3a' : '#3ecf8e' }}>
                            {c.activo ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <ClientModal
          client={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
