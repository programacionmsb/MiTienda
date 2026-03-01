import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, Package } from 'lucide-react';
import { productsAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useIsMobile from '../hooks/useIsMobile';
import toast from 'react-hot-toast';

const CATEGORIAS = ['bebidas', 'golosinas', 'abarrotes', 'panaderia', 'limpieza', 'otros'];
const UNIDADES   = ['unidad', 'kg', 'litro', 'paquete', 'caja'];

const EMPTY = {
  nombre: '', descripcion: '', categoria: 'bebidas', precio: '',
  costo: '', stock: '', stockMinimo: 5, unidad: 'unidad',
  codigoBarras: '', emoji: '📦', destacado: false,
};

const input = {
  width: '100%', background: '#211f1c', border: '1px solid #2e2b27',
  borderRadius: 10, padding: '0.65rem 0.85rem', color: '#f0ede8',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem', outline: 'none',
  boxSizing: 'border-box',
};
const label = { display: 'block', fontSize: '0.8rem', color: '#8a8680', marginBottom: '0.35rem' };

const badgeColor = (estado) => ({
  ok:      { bg: '#3ecf8e20', color: '#3ecf8e' },
  bajo:    { bg: '#f5a62320', color: '#f5a623' },
  agotado: { bg: '#e85d3a20', color: '#e85d3a' },
}[estado] || { bg: '#2e2b27', color: '#8a8680' });

function ProductModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product ? { ...product } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const isEdit = !!product?._id;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        precio:      parseFloat(form.precio),
        costo:       form.costo !== '' ? parseFloat(form.costo) : undefined,
        stock:       parseInt(form.stock, 10),
        stockMinimo: parseInt(form.stockMinimo, 10),
      };
      if (isEdit) {
        await productsAPI.update(product._id, payload);
        toast.success('Producto actualizado');
      } else {
        await productsAPI.create(payload);
        toast.success('Producto creado');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 20,
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.15rem', color: '#f0ede8', margin: 0 }}>
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8680', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: '0.75rem' }}>
            <div>
              <label style={label}>Emoji</label>
              <input value={form.emoji} onChange={e => set('emoji', e.target.value)}
                style={{ ...input, textAlign: 'center', fontSize: '1.4rem' }} maxLength={4} />
            </div>
            <div>
              <label style={label}>Nombre *</label>
              <input value={form.nombre} onChange={e => set('nombre', e.target.value)}
                required placeholder="Ej: Coca-Cola 600ml" style={input} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={label}>Categoría *</label>
              <select value={form.categoria} onChange={e => set('categoria', e.target.value)}
                style={{ ...input, cursor: 'pointer' }}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Unidad</label>
              <select value={form.unidad} onChange={e => set('unidad', e.target.value)}
                style={{ ...input, cursor: 'pointer' }}>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={label}>Precio venta (S/) *</label>
              <input type="number" min="0" step="0.01" value={form.precio}
                onChange={e => set('precio', e.target.value)} required placeholder="0.00" style={input} />
            </div>
            <div>
              <label style={label}>Costo (S/)</label>
              <input type="number" min="0" step="0.01" value={form.costo}
                onChange={e => set('costo', e.target.value)} placeholder="0.00" style={input} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={label}>Stock inicial *</label>
              <input type="number" min="0" step="1" value={form.stock}
                onChange={e => set('stock', e.target.value)} required placeholder="0" style={input} />
            </div>
            <div>
              <label style={label}>Stock mínimo</label>
              <input type="number" min="0" step="1" value={form.stockMinimo}
                onChange={e => set('stockMinimo', e.target.value)} style={input} />
            </div>
          </div>

          <div>
            <label style={label}>Código de barras</label>
            <input value={form.codigoBarras} onChange={e => set('codigoBarras', e.target.value)}
              placeholder="Opcional" style={input} />
          </div>

          <div>
            <label style={label}>Descripción</label>
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
              placeholder="Opcional" rows={2}
              style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: '#f0ede8' }}>
            <input type="checkbox" checked={form.destacado} onChange={e => set('destacado', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#f5a623' }} />
            Producto destacado (aparece en tienda)
          </label>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10,
              padding: '0.75rem', color: '#8a8680', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
            }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, background: '#f5a623', border: 'none', borderRadius: 10,
              padding: '0.75rem', color: '#0f0e0c', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'admin';
  const isMobile = useIsMobile();

  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal]         = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search)    params.search    = search;
      if (catFilter) params.categoria = catFilter;
      const res = await productsAPI.getAll(params);
      setProducts(res.data.data);
    } catch {
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, catFilter]);

  const handleDelete = async (p) => {
    if (!window.confirm(`¿Desactivar "${p.nombre}"?`)) return;
    try {
      await productsAPI.delete(p._id);
      toast.success('Producto desactivado');
      load();
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <div style={{ padding: isMobile ? '1rem' : '2rem', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '1.5rem' : '1.8rem', margin: 0 }}>Productos</h1>
          <p style={{ color: '#8a8680', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            {products.length} producto{products.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setModal('new')} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: '#f5a623', border: 'none', borderRadius: 12,
            padding: '0.65rem 1.1rem', color: '#0f0e0c', fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
          }}>
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#8a8680' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            style={{ ...input, paddingLeft: '2.1rem' }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ ...input, width: 'auto', cursor: 'pointer', flex: '0 0 150px' }}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>Cargando...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>
            <Package size={40} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
            <div>No hay productos</div>
          </div>
        ) : isMobile ? (
          /* Vista tarjetas en mobile */
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {products.map((p, i) => {
              const estado = p.estadoStock || (p.stock === 0 ? 'agotado' : p.stock <= p.stockMinimo ? 'bajo' : 'ok');
              const bc = badgeColor(estado);
              return (
                <div key={p._id} style={{ padding: '0.9rem 1rem', borderBottom: i < products.length - 1 ? '1px solid #2e2b27' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1.4rem' }}>{p.emoji}</span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#8a8680' }}>{p.categoria}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem', flexShrink: 0 }}>
                      <span style={{ color: '#f5a623', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>S/ {parseFloat(p.precio).toFixed(2)}</span>
                      <span style={{ background: bc.bg, color: bc.color, borderRadius: 5, padding: '0.15rem 0.45rem', fontSize: '0.72rem', fontWeight: 600 }}>{estado}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#8a8680' }}>Stock: <strong style={{ color: '#f0ede8' }}>{p.stock}</strong></span>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => setModal(p)} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8, padding: '0.35rem 0.55rem', cursor: 'pointer', color: '#f0ede8' }}>
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(p)} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8, padding: '0.35rem 0.55rem', cursor: 'pointer', color: '#e85d3a' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Vista tabla en desktop */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2b27' }}>
                  {['Producto', 'Categoría', 'Precio', 'Costo', 'Stock', 'Estado', isAdmin ? 'Acciones' : ''].map(h => h && (
                    <th key={h} style={{
                      padding: '0.9rem 1rem', textAlign: 'left', fontSize: '0.75rem',
                      color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const estado = p.estadoStock || (p.stock === 0 ? 'agotado' : p.stock <= p.stockMinimo ? 'bajo' : 'ok');
                  const bc = badgeColor(estado);
                  return (
                    <tr key={p._id} style={{ borderBottom: i < products.length - 1 ? '1px solid #2e2b27' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#211f1c'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontSize: '1.3rem' }}>{p.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '0.92rem' }}>{p.nombre}</div>
                            {p.codigoBarras && <div style={{ fontSize: '0.72rem', color: '#8a8680' }}>{p.codigoBarras}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 6, padding: '0.2rem 0.55rem', fontSize: '0.78rem', color: '#8a8680' }}>{p.categoria}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#f5a623' }}>S/ {parseFloat(p.precio).toFixed(2)}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#8a8680', fontSize: '0.88rem' }}>{p.costo ? `S/ ${parseFloat(p.costo).toFixed(2)}` : '—'}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{p.stock}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: bc.bg, color: bc.color, borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 600 }}>{estado}</span>
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button onClick={() => setModal(p)} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#f0ede8' }}><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(p)} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#e85d3a' }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
