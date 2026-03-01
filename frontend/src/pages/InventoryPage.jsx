import { useEffect, useState, useCallback } from 'react';
import { Search, AlertTriangle, SlidersHorizontal, X } from 'lucide-react';
import { productsAPI } from '../services/api';
import useIsMobile from '../hooks/useIsMobile';
import toast from 'react-hot-toast';

const CATEGORIAS = ['bebidas', 'golosinas', 'abarrotes', 'panaderia', 'limpieza', 'otros'];

const ESTADO_CFG = {
  ok:      { color: '#3ecf8e', bg: '#3ecf8e20', label: 'OK'      },
  bajo:    { color: '#f5a623', bg: '#f5a62320', label: 'Bajo'    },
  agotado: { color: '#e85d3a', bg: '#e85d3a20', label: 'Agotado' },
};

const getEstado = (p) => {
  if (p.stock === 0)            return 'agotado';
  if (p.stock <= p.stockMinimo) return 'bajo';
  return 'ok';
};

const S = (v) => `S/ ${(v || 0).toFixed(2)}`;

const inputStyle = {
  background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10,
  padding: '0.65rem 0.85rem', color: '#f0ede8',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

function AjusteModal({ product, onClose, onSaved }) {
  const [tipo, setTipo]       = useState('entrada');
  const [cantidad, setCantidad] = useState('');
  const [saving, setSaving]   = useState(false);

  const nuevoStock = () => {
    const c = parseInt(cantidad, 10) || 0;
    if (tipo === 'ajuste')  return c;
    if (tipo === 'entrada') return product.stock + c;
    if (tipo === 'salida')  return Math.max(0, product.stock - c);
    return product.stock;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const c = parseInt(cantidad, 10);
    if (!c || c <= 0) { toast.error('Ingresá una cantidad válida'); return; }
    setSaving(true);
    try {
      await productsAPI.adjustStock(product._id, { cantidad: c, tipo });
      toast.success('Stock actualizado');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al ajustar stock');
    } finally {
      setSaving(false);
    }
  };

  const tipoBtn = (t, lbl, color) => (
    <button type="button" onClick={() => setTipo(t)} style={{
      flex: 1, background: tipo === t ? `${color}25` : '#211f1c',
      border: `1px solid ${tipo === t ? color : '#2e2b27'}`,
      borderRadius: 9, padding: '0.55rem 0.4rem',
      color: tipo === t ? color : '#8a8680',
      fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
      fontWeight: tipo === t ? 700 : 400, cursor: 'pointer',
    }}>{lbl}</button>
  );

  const nuevo = nuevoStock();
  const delta = nuevo - product.stock;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 20, width: '100%', maxWidth: 400, padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', margin: 0 }}>{product.emoji} {product.nombre}</h2>
            <p style={{ color: '#8a8680', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>Stock actual: <strong style={{ color: '#f0ede8' }}>{product.stock}</strong></p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8680' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Tipo de movimiento</label>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {tipoBtn('entrada', '⬆ Entrada', '#3ecf8e')}
              {tipoBtn('salida',  '⬇ Salida',  '#e85d3a')}
              {tipoBtn('ajuste',  '✎ Ajuste',  '#6495ED')}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              {tipo === 'ajuste' ? 'Nuevo stock total' : 'Cantidad'}
            </label>
            <input type="number" min="1" step="1" value={cantidad} onChange={e => setCantidad(e.target.value)}
              placeholder={tipo === 'ajuste' ? `Ej: ${product.stock}` : 'Ej: 10'}
              required style={inputStyle} autoFocus />
          </div>
          {cantidad && parseInt(cantidad) > 0 && (
            <div style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#8a8680', fontSize: '0.88rem' }}>Resultado</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ color: '#8a8680', fontSize: '0.82rem' }}>{product.stock}</span>
                <span style={{ color: '#8a8680' }}>→</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.2rem', color: delta > 0 ? '#3ecf8e' : delta < 0 ? '#e85d3a' : '#f0ede8' }}>{nuevo}</span>
                {delta !== 0 && <span style={{ fontSize: '0.78rem', color: delta > 0 ? '#3ecf8e' : '#e85d3a' }}>({delta > 0 ? '+' : ''}{delta})</span>}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10, padding: '0.7rem', color: '#8a8680', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{ flex: 2, background: '#f5a623', border: 'none', borderRadius: 10, padding: '0.7rem', color: '#0f0e0c', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Confirmar ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [products, setProducts]     = useState([]);
  const [alertas, setAlertas]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [modal, setModal]           = useState(null);
  const isMobile = useIsMobile();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 200 };
      if (search)    params.search    = search;
      if (catFilter) params.categoria = catFilter;
      if (stockFilter === 'bajo' || stockFilter === 'agotado') params.stockBajo = 'true';
      const [prodRes, alertRes] = await Promise.all([productsAPI.getAll(params), productsAPI.getAlertas()]);
      let data = prodRes.data.data;
      if (stockFilter === 'agotado') data = data.filter(p => p.stock === 0);
      setProducts(data);
      setAlertas(alertRes.data.data);
    } catch {
      toast.error('Error cargando inventario');
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, stockFilter]);

  useEffect(() => { load(); }, [load]);

  const totalProductos = products.length;
  const agotados       = products.filter(p => p.stock === 0).length;
  const stockBajo      = products.filter(p => p.stock > 0 && p.stock <= p.stockMinimo).length;
  const valorTotal     = products.reduce((s, p) => s + (p.costo || p.precio) * p.stock, 0);

  return (
    <div style={{ padding: isMobile ? '1rem' : '2rem', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '1.5rem' : '1.8rem', margin: 0 }}>Inventario</h1>
        <p style={{ color: '#8a8680', marginTop: '0.25rem', fontSize: '0.9rem' }}>Control de stock en tiempo real</p>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Productos',    value: totalProductos, color: '#f0ede8' },
          { label: 'Stock bajo',   value: stockBajo,      color: '#f5a623' },
          { label: 'Agotados',     value: agotados,       color: '#e85d3a' },
          { label: 'Valor aprox.', value: S(valorTotal),  color: '#3ecf8e' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 14, padding: '0.85rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>{label}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '1.3rem' : '1.5rem', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div style={{ background: '#2a1a0e', border: '1px solid #f5a62340', borderRadius: 14, padding: '0.9rem 1.1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <AlertTriangle size={14} color="#f5a623" />
            <span style={{ color: '#f5a623', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {alertas.length} producto{alertas.length !== 1 ? 's' : ''} con stock crítico
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {alertas.map(p => {
              const cfg = ESTADO_CFG[getEstado(p)];
              return (
                <div key={p._id} onClick={() => setModal(p)} style={{
                  background: cfg.bg, border: `1px solid ${cfg.color}40`,
                  borderRadius: 8, padding: '0.28rem 0.65rem',
                  display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer',
                }}>
                  <span>{p.emoji}</span>
                  <span style={{ color: '#f0ede8', fontSize: '0.8rem' }}>{p.nombre}</span>
                  <span style={{ color: cfg.color, fontWeight: 700, fontSize: '0.8rem' }}>{p.stock}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 160px' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8a8680' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            style={{ ...inputStyle, paddingLeft: '2rem' }} />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', flex: '0 0 140px', cursor: 'pointer' }}>
          <option value="">Categorías</option>
          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
          style={{ ...inputStyle, width: 'auto', flex: '0 0 130px', cursor: 'pointer' }}>
          <option value="">Todo stock</option>
          <option value="bajo">Stock bajo</option>
          <option value="agotado">Agotados</option>
        </select>
      </div>

      {/* Tabla / Tarjetas */}
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>Cargando...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>Sin productos</div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {products.map((p, i) => {
              const estado = getEstado(p);
              const cfg = ESTADO_CFG[estado];
              return (
                <div key={p._id} style={{ padding: '0.85rem 1rem', borderBottom: i < products.length - 1 ? '1px solid #2e2b27' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1.3rem' }}>{p.emoji}</span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nombre}</div>
                        <div style={{ fontSize: '0.72rem', color: '#8a8680' }}>{p.categoria}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', color: cfg.color, fontWeight: 700 }}>{p.stock}</span>
                      <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 5, padding: '0.1rem 0.4rem', fontSize: '0.68rem', fontWeight: 600 }}>{cfg.label}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#8a8680' }}>
                      Precio: <strong style={{ color: '#f5a623' }}>{S(p.precio)}</strong>
                      {p.costo ? <span> · Costo: {S(p.costo)}</span> : null}
                    </span>
                    <button onClick={() => setModal(p)} style={{
                      background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8,
                      padding: '0.35rem 0.65rem', cursor: 'pointer', color: '#f0ede8',
                      display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      <SlidersHorizontal size={12} /> Ajustar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2b27' }}>
                  {['Producto', 'Categoría', 'Stock', 'Mín.', 'Estado', 'Costo', 'Precio', 'Margen', 'Ajustar'].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.73rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((p, i) => {
                  const estado = getEstado(p);
                  const cfg = ESTADO_CFG[estado];
                  const margen = p.costo && p.costo > 0 ? (((p.precio - p.costo) / p.precio) * 100).toFixed(1) : null;
                  return (
                    <tr key={p._id} style={{ borderBottom: i < products.length - 1 ? '1px solid #2e2b27' : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#211f1c'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <span style={{ fontSize: '1.2rem' }}>{p.emoji}</span>
                          <span style={{ fontWeight: 500, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>{p.nombre}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 6, padding: '0.18rem 0.5rem', fontSize: '0.76rem', color: '#8a8680' }}>{p.categoria}</span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', color: cfg.color, fontWeight: 700, minWidth: 28 }}>{p.stock}</span>
                          <div style={{ width: 40, height: 4, background: '#2e2b27', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: cfg.color, width: `${Math.min(100, (p.stock / Math.max(p.stockMinimo * 2, 1)) * 100)}%` }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', color: '#8a8680', fontSize: '0.85rem' }}>{p.stockMinimo}</td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, padding: '0.18rem 0.55rem', fontSize: '0.76rem', fontWeight: 600 }}>{cfg.label}</span>
                      </td>
                      <td style={{ padding: '0.8rem 1rem', color: '#8a8680', fontSize: '0.85rem' }}>{p.costo ? S(p.costo) : '—'}</td>
                      <td style={{ padding: '0.8rem 1rem', color: '#f5a623', fontWeight: 600, fontSize: '0.88rem' }}>{S(p.precio)}</td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        {margen !== null
                          ? <span style={{ color: parseFloat(margen) >= 30 ? '#3ecf8e' : '#f5a623', fontSize: '0.85rem', fontWeight: 600 }}>{margen}%</span>
                          : <span style={{ color: '#8a8680', fontSize: '0.85rem' }}>—</span>}
                      </td>
                      <td style={{ padding: '0.8rem 1rem' }}>
                        <button onClick={() => setModal(p)} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: '#f0ede8', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif" }}>
                          <SlidersHorizontal size={12} /> Ajustar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <AjusteModal product={modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}
