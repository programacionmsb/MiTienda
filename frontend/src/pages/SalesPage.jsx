import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Minus, ShoppingCart, X, ChevronDown, ChevronUp } from 'lucide-react';
import { salesAPI, productsAPI, authAPI } from '../services/api';
import useIsMobile from '../hooks/useIsMobile';
import toast from 'react-hot-toast';

const METODOS = ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta', 'credito'];
const METODO_EMOJI = { efectivo: '💵', yape: '📲', plin: '📲', transferencia: '🏦', tarjeta: '💳', credito: '📒' };

const S = (v) => `S/ ${(v || 0).toFixed(2)}`;

const cell = { padding: '0.8rem 1rem', fontSize: '0.88rem' };
const input = {
  width: '100%', background: '#211f1c', border: '1px solid #2e2b27',
  borderRadius: 10, padding: '0.65rem 0.85rem', color: '#f0ede8',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem', outline: 'none',
  boxSizing: 'border-box',
};

// ── Resumen del día ────────────────────────────────────────────────────────
function ResumenDia() {
  const [data, setData] = useState(null);

  useEffect(() => {
    salesAPI.getResumen()
      .then(r => setData(r.data.data))
      .catch(() => {});
  }, []);

  if (!data?.resumen?.cantidadTickets) return null;
  const { totalVentas, cantidadTickets, ticketPromedio } = data.resumen;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
      {[
        { label: 'Total hoy', value: S(totalVentas), color: '#f5a623' },
        { label: 'Tickets', value: cantidadTickets, color: '#3ecf8e' },
        { label: 'Ticket promedio', value: S(ticketPromedio), color: '#6495ED' },
      ].map(({ label, value, color }) => (
        <div key={label} style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 14, padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{label}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.4rem', color }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

// ── Buscador de clientes ────────────────────────────────────────────────────
function ClienteSelector({ value, onChange }) {
  const [q, setQ]           = useState('');
  const [opciones, setOpciones] = useState([]);
  const [open, setOpen]     = useState(false);

  useEffect(() => {
    if (!q.trim()) { setOpciones([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await authAPI.getUsers({ search: q, rol: 'cliente', limit: 6 });
        setOpciones(res.data.data || []);
        setOpen(true);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const select = (c) => {
    onChange(c);
    setQ(c.nombre);
    setOpen(false);
    setOpciones([]);
  };

  const clear = () => { onChange(null); setQ(''); };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8a8680' }} />
        <input
          value={q} onChange={e => { setQ(e.target.value); if (!e.target.value) onChange(null); }}
          placeholder="Buscar cliente por nombre o email..."
          style={{ ...input, paddingLeft: '2rem', paddingRight: value ? '2rem' : undefined,
            borderColor: value ? '#f5a623' : '#2e2b27' }}
        />
        {value && (
          <button onClick={clear} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#8a8680' }}>
            <X size={13} />
          </button>
        )}
      </div>
      {value && (
        <div style={{ marginTop: 6, padding: '0.5rem 0.75rem', background: '#1a1916', border: '1px solid #f5a623', borderRadius: 8, fontSize: '0.82rem', color: '#f5a623' }}>
          {value.nombre} · {value.email}
          {value.deuda > 0 && <span style={{ marginLeft: 8, color: '#e85d3a' }}>Deuda: S/ {value.deuda.toFixed(2)}</span>}
        </div>
      )}
      {open && opciones.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 10, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          {opciones.map(c => (
            <div key={c._id} onClick={() => select(c)}
              style={{ padding: '0.6rem 1rem', cursor: 'pointer', fontSize: '0.88rem' }}
              onMouseEnter={e => e.currentTarget.style.background = '#211f1c'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: '#f0ede8' }}>{c.nombre}</span>
              <span style={{ color: '#8a8680', marginLeft: 8 }}>{c.email}</span>
              {c.deuda > 0 && <span style={{ marginLeft: 8, color: '#e85d3a', fontSize: '0.78rem' }}>Debe S/ {c.deuda.toFixed(2)}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Modal cobro rápido de deuda ─────────────────────────────────────────────
function CobroRapidoModal({ onClose }) {
  const [deudores, setDeudores] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [monto, setMonto]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    salesAPI.getDeudores()
      .then(r => setDeudores(r.data.data || []))
      .catch(() => toast.error('Error cargando deudores'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = deudores.filter(d =>
    !search.trim() ||
    d.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (d.telefono || '').includes(search)
  );

  const handleCobro = async () => {
    const m = parseFloat(monto);
    if (!m || m <= 0) { toast.error('Ingresá un monto válido'); return; }
    if (m > selected.deuda) { toast.error(`El monto supera la deuda (${S(selected.deuda)})`); return; }
    setSaving(true);
    try {
      await salesAPI.cobro({ clienteId: selected._id, monto: m });
      toast.success(`Cobro registrado — ${selected.nombre} pagó ${S(m)}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar cobro');
    } finally { setSaving(false); }
  };

  const deudaRestante = selected && monto ? Math.max(0, selected.deuda - parseFloat(monto || 0)) : null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 20, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", margin: 0, fontSize: '1.1rem' }}>📒 Cobrar deuda</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8680' }}><X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#8a8680' }}>Cargando...</div>
        ) : deudores.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#8a8680' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            No hay deudas pendientes
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Buscador */}
            {!selected && (
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8a8680' }} />
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  style={{ ...input, paddingLeft: '2rem' }} />
              </div>
            )}

            {/* Lista de deudores */}
            {!selected && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 240, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#8a8680', padding: '1rem', fontSize: '0.85rem' }}>Sin resultados</div>
                ) : filtered.map(d => (
                  <div key={d._id} onClick={() => { setSelected(d); setMonto(''); }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: '#211f1c', borderRadius: 10, cursor: 'pointer', border: '1px solid transparent', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#f5a62340'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{d.nombre}</div>
                      <div style={{ fontSize: '0.75rem', color: '#8a8680', marginTop: '0.1rem' }}>{d.telefono || d.email || '—'}</div>
                    </div>
                    <div style={{ color: '#e85d3a', fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: '1.05rem' }}>
                      {S(d.deuda)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cliente seleccionado */}
            {selected && (
              <>
                <div style={{ background: '#211f1c', border: '1px solid #f5a62340', borderRadius: 12, padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{selected.nombre}</div>
                    <div style={{ fontSize: '0.78rem', color: '#e85d3a', marginTop: '0.2rem', fontWeight: 600 }}>
                      Deuda pendiente: {S(selected.deuda)}
                    </div>
                  </div>
                  <button onClick={() => { setSelected(null); setMonto(''); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8680' }}><X size={15} /></button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#8a8680', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monto a cobrar (S/)</label>
                  <input autoFocus type="number" min="0.01" step="0.10" max={selected.deuda}
                    value={monto} onChange={e => setMonto(e.target.value)}
                    placeholder={`Máx. ${S(selected.deuda)}`}
                    style={input} />
                  {/* Botones rápidos */}
                  <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {[
                      { label: `Total (${S(selected.deuda)})`, value: selected.deuda.toFixed(2) },
                      { label: `50% (${S(selected.deuda / 2)})`, value: (selected.deuda / 2).toFixed(2) },
                    ].map(({ label, value }) => (
                      <button key={label} onClick={() => setMonto(value)}
                        style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 7, padding: '0.28rem 0.7rem', cursor: 'pointer', color: '#8a8680', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumen */}
                {monto && parseFloat(monto) > 0 && (
                  <div style={{ background: '#3ecf8e10', border: '1px solid #3ecf8e30', borderRadius: 10, padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.88rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8a8680' }}>Pago recibido</span>
                      <span style={{ color: '#3ecf8e', fontWeight: 700 }}>{S(parseFloat(monto))}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#8a8680' }}>Deuda restante</span>
                      <span style={{ color: deudaRestante === 0 ? '#3ecf8e' : '#e85d3a', fontWeight: 700 }}>
                        {deudaRestante === 0 ? '✓ Saldada' : S(deudaRestante)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button onClick={onClose}
                style={{ flex: 1, background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10, padding: '0.75rem', color: '#8a8680', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Cancelar
              </button>
              {selected && (
                <button onClick={handleCobro} disabled={saving || !monto || parseFloat(monto) <= 0}
                  style={{ flex: 2, background: '#3ecf8e', border: 'none', borderRadius: 10, padding: '0.75rem', color: '#0f0e0c', fontWeight: 700, cursor: (saving || !monto) ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: (saving || !monto) ? 0.6 : 1 }}>
                  {saving ? 'Registrando...' : 'Confirmar cobro'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── POS / Caja ─────────────────────────────────────────────────────────────
function Caja({ onSaleCreated, isMobile, onCobrar }) {
  const [search, setSearch]         = useState('');
  const [products, setProducts]     = useState([]);
  const [cart, setCart]             = useState([]);
  const [descuento, setDescuento]   = useState('');
  const [metodo, setMetodo]         = useState('efectivo');
  const [montoPagado, setMontoPagado] = useState('');
  const [cliente, setCliente]       = useState(null);
  const [saving, setSaving]         = useState(false);

  const buscar = useCallback(async (q) => {
    if (!q.trim()) { setProducts([]); return; }
    try {
      const res = await productsAPI.getAll({ search: q, limit: 8 });
      setProducts(res.data.data.filter(p => p.stock > 0));
    } catch {}
  }, []);

  useEffect(() => {
    const t = setTimeout(() => buscar(search), 300);
    return () => clearTimeout(t);
  }, [search, buscar]);

  const addToCart = (p) => {
    setCart(c => {
      const idx = c.findIndex(i => i._id === p._id);
      if (idx >= 0) {
        if (c[idx].cantidad >= p.stock) { toast.error('Stock insuficiente'); return c; }
        return c.map((i, n) => n === idx ? { ...i, cantidad: i.cantidad + 1 } : i);
      }
      return [...c, { ...p, cantidad: 1 }];
    });
    setSearch('');
    setProducts([]);
  };

  const updateQty = (id, delta) => {
    setCart(c => c
      .map(i => i._id === id ? { ...i, cantidad: i.cantidad + delta } : i)
      .filter(i => i.cantidad > 0)
    );
  };

  const removeItem = (id) => setCart(c => c.filter(i => i._id !== id));

  const subtotal  = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const desc      = parseFloat(descuento) || 0;
  const total     = Math.max(0, subtotal - desc);
  const vuelto    = metodo === 'efectivo' && montoPagado ? Math.max(0, parseFloat(montoPagado) - total) : null;

  const handleVenta = async () => {
    if (cart.length === 0) { toast.error('Agregá al menos un producto'); return; }
    if (metodo === 'efectivo' && montoPagado && parseFloat(montoPagado) < total) {
      toast.error('El monto pagado es menor al total'); return;
    }
    if (metodo === 'credito' && !cliente) {
      toast.error('Seleccioná un cliente para vender a crédito');
      return;
    }
    setSaving(true);
    try {
      await salesAPI.create({
        items: cart.map(i => ({ productoId: i._id, cantidad: i.cantidad })),
        metodoPago: metodo,
        montoPagado: metodo === 'credito' ? 0 : (montoPagado ? parseFloat(montoPagado) : total),
        descuento: desc,
        clienteId: cliente?._id,
      });
      toast.success(metodo === 'credito' ? `Venta a crédito registrada — ${cliente.nombre} debe S/ ${total.toFixed(2)}` : '¡Venta registrada!');
      setCart([]);
      setDescuento('');
      setMontoPagado('');
      setMetodo('efectivo');
      setCliente(null);
      onSaleCreated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar venta');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: '1rem', alignItems: 'start' }}>

      {/* Columna izquierda: buscador + carrito */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Buscador */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8a8680' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto para agregar..."
            style={{ ...input, paddingLeft: '2.2rem' }}
            autoFocus
          />
          {/* Resultados */}
          {products.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
              background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 12,
              marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {products.map(p => (
                <div key={p._id} onClick={() => addToCart(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 1rem', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#211f1c'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: '1.2rem' }}>{p.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f0ede8', fontSize: '0.9rem' }}>{p.nombre}</div>
                    <div style={{ color: '#8a8680', fontSize: '0.75rem' }}>Stock: {p.stock}</div>
                  </div>
                  <div style={{ color: '#f5a623', fontWeight: 700 }}>{S(p.precio)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carrito */}
        <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, overflow: 'hidden', minHeight: 200 }}>
          {cart.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>
              <ShoppingCart size={36} style={{ marginBottom: '0.75rem', opacity: 0.25 }} />
              <div style={{ fontSize: '0.9rem' }}>Buscá productos para agregarlos</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2b27' }}>
                  {['Producto', 'Precio', 'Cant.', 'Subtotal', ''].map(h => (
                    <th key={h} style={{ ...cell, color: '#8a8680', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cart.map(item => (
                  <tr key={item._id} style={{ borderBottom: '1px solid #2e2b27' }}>
                    <td style={cell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{item.emoji}</span>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.nombre}</span>
                      </div>
                    </td>
                    <td style={{ ...cell, color: '#8a8680' }}>{S(item.precio)}</td>
                    <td style={cell}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button onClick={() => updateQty(item._id, -1)} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{item.cantidad}</span>
                        <button onClick={() => updateQty(item._id, 1)} style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ ...cell, fontWeight: 700, color: '#f5a623' }}>{S(item.precio * item.cantidad)}</td>
                    <td style={cell}>
                      <button onClick={() => removeItem(item._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e85d3a', padding: 2 }}>
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Columna derecha: resumen + cobro */}
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", margin: 0, fontSize: '1.1rem' }}>Cobro</h3>

        {/* Totales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8a8680' }}>
            <span>Subtotal</span><span>{S(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#8a8680' }}>
            <span>Descuento</span>
            <input
              type="number" min="0" step="0.10" value={descuento}
              onChange={e => setDescuento(e.target.value)}
              placeholder="0.00"
              style={{ ...input, width: 90, padding: '0.35rem 0.6rem', textAlign: 'right' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', borderTop: '1px solid #2e2b27', paddingTop: '0.75rem', color: '#f5a623' }}>
            <span>Total</span><span>{S(total)}</span>
          </div>
        </div>

        {/* Método de pago */}
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Método de pago</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {METODOS.map(m => (
              <button key={m} onClick={() => setMetodo(m)} style={{
                background: metodo === m ? '#f5a623' : '#211f1c',
                border: `1px solid ${metodo === m ? '#f5a623' : '#2e2b27'}`,
                borderRadius: 8, padding: '0.4rem 0.7rem', cursor: 'pointer',
                color: metodo === m ? '#0f0e0c' : '#f0ede8',
                fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: metodo === m ? 700 : 400,
                transition: 'all 0.15s',
              }}>
                {METODO_EMOJI[m]} {m}
              </button>
            ))}
          </div>
        </div>

        {/* Cliente (requerido para crédito, opcional para otros) */}
        {metodo === 'credito' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#e85d3a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
              Cliente * (requerido)
            </label>
            <ClienteSelector value={cliente} onChange={setCliente} />
          </div>
        )}

        {/* Monto pagado (efectivo) */}
        {metodo === 'efectivo' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>Monto recibido</label>
            <input
              type="number" min="0" step="0.10" value={montoPagado}
              onChange={e => setMontoPagado(e.target.value)}
              placeholder={total.toFixed(2)}
              style={input}
            />
            {vuelto !== null && vuelto >= 0 && (
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem' }}>
                <span style={{ color: '#8a8680' }}>Vuelto</span>
                <span style={{ color: '#3ecf8e', fontWeight: 700 }}>{S(vuelto)}</span>
              </div>
            )}
          </div>
        )}

        {/* Botón cobrar */}
        <button onClick={handleVenta} disabled={saving || cart.length === 0} style={{
          background: cart.length === 0 ? '#2e2b27' : '#f5a623',
          border: 'none', borderRadius: 12, padding: '0.9rem',
          color: cart.length === 0 ? '#8a8680' : '#0f0e0c',
          fontWeight: 700, fontSize: '1rem', cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? 'Registrando...' : `Cobrar ${S(total)}`}
        </button>

        {/* Separador */}
        <div style={{ borderTop: '1px solid #2e2b27', paddingTop: '0.75rem' }}>
          <button onClick={onCobrar} style={{
            width: '100%', background: 'transparent',
            border: '1px solid #e85d3a50', borderRadius: 12, padding: '0.75rem',
            color: '#e85d3a', fontWeight: 600, fontSize: '0.9rem',
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#e85d3a15'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            📒 Cobrar deuda de cliente
          </button>
        </div>
      </div>
    </div>

  );
}

// ── Historial ──────────────────────────────────────────────────────────────
function Historial() {
  const [sales, setSales]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [totalVendido, setTotalVendido] = useState(0);
  const [metodo, setMetodo]   = useState('');
  const [desde, setDesde]     = useState('');
  const [hasta, setHasta]     = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (metodo) params.metodoPago = metodo;
      if (desde)  params.desde = desde;
      if (hasta)  params.hasta = hasta;
      const res = await salesAPI.getAll(params);
      setSales(res.data.data);
      setTotal(res.data.total);
      setTotalVendido(res.data.totalVendido);
    } catch {
      toast.error('Error cargando historial');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [metodo, desde, hasta]);

  const fmtDate = (d) => new Date(d).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
          style={{ ...input, width: 'auto', flex: '0 0 150px' }} />
        <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
          style={{ ...input, width: 'auto', flex: '0 0 150px' }} />
        <select value={metodo} onChange={e => setMetodo(e.target.value)}
          style={{ ...input, width: 'auto', flex: '0 0 160px', cursor: 'pointer' }}>
          <option value="">Todos los métodos</option>
          {METODOS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', color: '#8a8680', fontSize: '0.85rem' }}>
          {total} ventas · <span style={{ color: '#f5a623', fontWeight: 700 }}>{S(totalVendido)}</span>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>Cargando...</div>
        ) : sales.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>Sin ventas en este período</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2e2b27' }}>
                {['#', 'Fecha', 'Items', 'Descuento', 'Total', 'Método', 'Cajero', ''].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.73rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.map((s, i) => (
                <>
                  <tr key={s._id}
                    style={{ borderBottom: expanded === s._id ? 'none' : '1px solid #2e2b27', cursor: 'pointer' }}
                    onClick={() => setExpanded(expanded === s._id ? null : s._id)}
                    onMouseEnter={e => e.currentTarget.style.background = '#211f1c'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...cell, color: '#8a8680', fontFamily: 'monospace' }}>#{s.numero || i + 1}</td>
                    <td style={{ ...cell, fontSize: '0.82rem', color: '#8a8680' }}>{fmtDate(s.createdAt)}</td>
                    <td style={cell}>{s.items?.length} producto{s.items?.length !== 1 ? 's' : ''}</td>
                    <td style={{ ...cell, color: s.descuento > 0 ? '#e85d3a' : '#8a8680' }}>
                      {s.descuento > 0 ? `-${S(s.descuento)}` : '—'}
                    </td>
                    <td style={{ ...cell, fontWeight: 700, color: '#f5a623' }}>{S(s.total)}</td>
                    <td style={cell}>{METODO_EMOJI[s.metodoPago]} {s.metodoPago}</td>
                    <td style={{ ...cell, color: '#8a8680', fontSize: '0.85rem' }}>{s.cajero?.nombre || '—'}</td>
                    <td style={cell}>
                      {expanded === s._id ? <ChevronUp size={14} color="#8a8680" /> : <ChevronDown size={14} color="#8a8680" />}
                    </td>
                  </tr>
                  {expanded === s._id && (
                    <tr key={`${s._id}-detail`} style={{ borderBottom: '1px solid #2e2b27', background: '#150f0a' }}>
                      <td colSpan={8} style={{ padding: '0.75rem 1rem 1rem 2.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {s.items?.map((it, j) => (
                            <div key={j} style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#8a8680' }}>
                              <span style={{ minWidth: 160, color: '#f0ede8' }}>{it.nombre}</span>
                              <span>{it.cantidad} × {S(it.precio)}</span>
                              <span style={{ color: '#f5a623' }}>{S(it.subtotal)}</span>
                            </div>
                          ))}
                          {s.metodoPago === 'efectivo' && s.vuelto > 0 && (
                            <div style={{ marginTop: '0.4rem', fontSize: '0.82rem', color: '#3ecf8e' }}>
                              Pagó {S(s.montoPagado)} · Vuelto {S(s.vuelto)}
                            </div>
                          )}
                          {s.cliente && (
                            <div style={{ fontSize: '0.82rem', color: '#6495ED', marginTop: '0.2rem' }}>
                              Cliente: {s.cliente.nombre} · +{s.puntosOtorgados} pts
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Créditos / Deudores ─────────────────────────────────────────────────────
function Creditos() {
  const [deudores, setDeudores] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cobro, setCobro]       = useState({ clienteId: null, nombre: '', monto: '' });
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await salesAPI.getDeudores();
      setDeudores(res.data.data);
    } catch { toast.error('Error cargando deudores'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const abrirCobro = (d) => setCobro({ clienteId: d._id, nombre: d.nombre, monto: '' });

  const handleCobro = async () => {
    if (!cobro.monto || parseFloat(cobro.monto) <= 0) { toast.error('Ingresá un monto válido'); return; }
    setSaving(true);
    try {
      await salesAPI.cobro({ clienteId: cobro.clienteId, monto: parseFloat(cobro.monto) });
      toast.success(`Pago registrado — ${cobro.nombre}`);
      setCobro({ clienteId: null, nombre: '', monto: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al registrar cobro');
    } finally { setSaving(false); }
  };

  const S = (v) => `S/ ${(v || 0).toFixed(2)}`;
  const totalDeuda = deudores.reduce((s, d) => s + d.deuda, 0);

  return (
    <div>
      {/* Resumen */}
      {!loading && deudores.length > 0 && (
        <div style={{ background: '#1a1916', border: '1px solid #e85d3a33', borderRadius: 14, padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#8a8680', fontSize: '0.9rem' }}>{deudores.length} cliente{deudores.length !== 1 ? 's' : ''} con deuda pendiente</span>
          <span style={{ color: '#e85d3a', fontFamily: "'Syne', sans-serif", fontSize: '1.3rem', fontWeight: 700 }}>{S(totalDeuda)}</span>
        </div>
      )}

      {/* Modal cobro */}
      {cobro.clienteId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 380 }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", margin: '0 0 1.25rem', fontSize: '1.1rem' }}>
              Registrar cobro — {cobro.nombre}
            </h3>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#8a8680', marginBottom: '0.4rem' }}>Monto a cobrar (S/)</label>
            <input
              type="number" min="0.01" step="0.10"
              value={cobro.monto} onChange={e => setCobro(c => ({ ...c, monto: e.target.value }))}
              placeholder="0.00" autoFocus
              style={{ width: '100%', background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10, padding: '0.75rem 1rem', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif", fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setCobro({ clienteId: null, nombre: '', monto: '' })}
                style={{ flex: 1, background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10, padding: '0.75rem', color: '#f0ede8', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Cancelar
              </button>
              <button onClick={handleCobro} disabled={saving}
                style={{ flex: 1, background: '#3ecf8e', border: 'none', borderRadius: 10, padding: '0.75rem', color: '#0f0e0c', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Confirmar cobro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>Cargando...</div>
        ) : deudores.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            No hay deudas pendientes
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2e2b27' }}>
                {['Cliente', 'Email', 'Teléfono', 'Deuda', ''].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.73rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deudores.map(d => (
                <tr key={d._id} style={{ borderBottom: '1px solid #2e2b27' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#211f1c'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '0.8rem 1rem', fontWeight: 600 }}>{d.nombre}</td>
                  <td style={{ padding: '0.8rem 1rem', color: '#8a8680', fontSize: '0.85rem' }}>{d.email}</td>
                  <td style={{ padding: '0.8rem 1rem', color: '#8a8680', fontSize: '0.85rem' }}>{d.telefono || '—'}</td>
                  <td style={{ padding: '0.8rem 1rem', color: '#e85d3a', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{S(d.deuda)}</td>
                  <td style={{ padding: '0.8rem 1rem' }}>
                    <button onClick={() => abrirCobro(d)} style={{
                      background: '#3ecf8e22', border: '1px solid #3ecf8e55', borderRadius: 8,
                      padding: '0.35rem 0.85rem', color: '#3ecf8e', cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', fontWeight: 600,
                    }}>
                      Cobrar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function SalesPage() {
  const [tab, setTab]           = useState('caja');
  const [historialKey, setHistorialKey] = useState(0);
  const [showCobro, setShowCobro] = useState(false);
  const isMobile = useIsMobile();

  const onSaleCreated = () => {
    if (tab === 'historial') setHistorialKey(k => k + 1);
  };

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)} style={{
      background: tab === id ? '#f5a623' : 'transparent',
      border: `1px solid ${tab === id ? '#f5a623' : '#2e2b27'}`,
      borderRadius: 10, padding: '0.5rem 1.2rem',
      color: tab === id ? '#0f0e0c' : '#8a8680',
      fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem',
      fontWeight: tab === id ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s',
    }}>{label}</button>
  );

  return (
    <div style={{ padding: isMobile ? '1rem' : '2rem', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '1.5rem' : '1.8rem', margin: 0 }}>Ventas</h1>
        <p style={{ color: '#8a8680', marginTop: '0.25rem', fontSize: '0.9rem' }}>Caja y registro de ventas</p>
      </div>

      <ResumenDia />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {tabBtn('caja', '🧾 Nueva venta')}
        {tabBtn('historial', '📋 Historial')}
        {tabBtn('creditos', '📒 Créditos')}
      </div>

      {tab === 'caja' && <Caja onSaleCreated={onSaleCreated} isMobile={isMobile} onCobrar={() => setShowCobro(true)} />}
      {tab === 'historial' && <Historial key={historialKey} />}
      {tab === 'creditos' && <Creditos />}

      {showCobro && <CobroRapidoModal onClose={() => setShowCobro(false)} />}
    </div>
  );
}
