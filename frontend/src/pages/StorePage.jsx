import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, X, Search, LogIn, ChevronRight, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { productsAPI, ordersAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useIsMobile from '../hooks/useIsMobile';
import toast from 'react-hot-toast';

const CATEGORIAS = ['bebidas', 'golosinas', 'abarrotes', 'panaderia', 'limpieza', 'otros'];
const METODOS_BASE = ['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta'];
const METODO_EMOJI = { efectivo: '💵', yape: '📲', plin: '📲', transferencia: '🏦', tarjeta: '💳', credito: '📒' };
const S = (v) => `S/ ${(v || 0).toFixed(2)}`;

const inputStyle = {
  width: '100%', background: '#211f1c', border: '1px solid #2e2b27',
  borderRadius: 10, padding: '0.65rem 0.85rem', color: '#f0ede8',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', outline: 'none',
  boxSizing: 'border-box',
};
const label = { display: 'block', fontSize: '0.78rem', color: '#8a8680', marginBottom: '0.35rem' };

// ── Tarjeta de producto ────────────────────────────────────────────────────
function ProductCard({ product, onAdd }) {
  const agotado = product.stock === 0;
  return (
    <div style={{
      background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.15s, transform 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#f5a62340'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2e2b27';  e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Imagen / emoji */}
      <div style={{
        background: '#211f1c', display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 100, fontSize: '3.5rem', position: 'relative',
      }}>
        {product.emoji}
        {product.destacado && (
          <span style={{
            position: 'absolute', top: 8, right: 8, background: '#f5a623',
            color: '#0f0e0c', fontSize: '0.6rem', fontWeight: 700, borderRadius: 4,
            padding: '0.15rem 0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>Top</span>
        )}
        {agotado && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(15,14,12,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#e85d3a', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.05em' }}>AGOTADO</span>
          </div>
        )}
      </div>

      <div style={{ padding: '0.9rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.7rem', color: '#8a8680', textTransform: 'capitalize' }}>{product.categoria}</span>
        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#f0ede8', lineHeight: 1.3 }}>{product.nombre}</div>
        {product.descripcion && (
          <div style={{ fontSize: '0.78rem', color: '#8a8680', lineHeight: 1.4 }}>{product.descripcion}</div>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', color: '#f5a623', fontWeight: 700 }}>
            {S(product.precio)}
          </span>
          <button onClick={() => !agotado && onAdd(product)} disabled={agotado} style={{
            background: agotado ? '#2e2b27' : '#f5a623', border: 'none', borderRadius: 9,
            width: 32, height: 32, cursor: agotado ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: agotado ? '#8a8680' : '#0f0e0c', transition: 'opacity 0.15s',
          }}>
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Carrito drawer ─────────────────────────────────────────────────────────
function CartDrawer({ cart, onClose, onUpdateQty, onRemove, onOrderPlaced }) {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep]       = useState('cart'); // 'cart' | 'checkout' | 'success'
  const [saving, setSaving]   = useState(false);
  const [orderNum, setOrderNum] = useState(null);
  const [form, setForm] = useState({
    nombreCliente: user?.nombre || '',
    telefono:      user?.telefono || '',
    tipoEntrega:   'delivery',
    direccion:     '',
    metodoPago:    'efectivo',
    notas:         '',
  });

  // Métodos disponibles: crédito solo para usuarios logueados
  const METODOS = token ? [...METODOS_BASE, 'credito'] : METODOS_BASE;

  const total = cart.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const set   = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleOrder = async () => {
    if (!form.nombreCliente.trim()) { toast.error('Ingresá tu nombre'); return; }
    if (!form.telefono.trim())      { toast.error('Ingresá tu teléfono'); return; }
    if (form.tipoEntrega === 'delivery' && !form.direccion.trim()) {
      toast.error('Ingresá la dirección de entrega'); return;
    }
    setSaving(true);
    try {
      const res = await ordersAPI.create({
        items: cart.map(i => ({ productoId: i._id, cantidad: i.cantidad })),
        ...form,
      });
      setOrderNum(res.data.data.numero);
      setStep('success');
      onOrderPlaced();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al hacer el pedido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
      }} />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 400, maxWidth: '95vw',
        background: '#1a1916', borderLeft: '1px solid #2e2b27', zIndex: 101,
        display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #2e2b27', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', color: '#f0ede8', margin: 0 }}>
            {step === 'cart' ? `Carrito (${cart.length})` : step === 'checkout' ? 'Completar pedido' : '¡Pedido realizado!'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8680' }}>
            <X size={20} />
          </button>
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>

          {/* ── ÉXITO ─────────────────────────────────────────── */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '2rem 0' }}>
              <CheckCircle size={56} color="#3ecf8e" style={{ marginBottom: '1rem' }} />
              <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.3rem', color: '#f0ede8', marginBottom: '0.5rem' }}>
                ¡Pedido #{String(orderNum).padStart(4, '0')} recibido!
              </h3>
              <p style={{ color: '#8a8680', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Ya recibimos tu pedido. Te avisaremos cuando esté listo.
              </p>
              {user && (
                <button onClick={() => { onClose(); navigate('/pedidos'); }} style={{
                  marginTop: '1.5rem', background: '#f5a623', border: 'none', borderRadius: 12,
                  padding: '0.75rem 1.5rem', color: '#0f0e0c', fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem', cursor: 'pointer',
                }}>
                  Ver mis pedidos
                </button>
              )}
            </div>
          )}

          {/* ── CARRITO ───────────────────────────────────────── */}
          {step === 'cart' && (
            cart.length === 0
              ? (
                <div style={{ textAlign: 'center', padding: '3rem 0', color: '#8a8680' }}>
                  <ShoppingCart size={40} style={{ marginBottom: '0.75rem', opacity: 0.25 }} />
                  <div>Tu carrito está vacío</div>
                </div>
              )
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {cart.map(item => (
                    <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#211f1c', borderRadius: 12 }}>
                      <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 500, fontSize: '0.88rem', color: '#f0ede8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</div>
                        <div style={{ color: '#f5a623', fontSize: '0.82rem', fontWeight: 600 }}>{S(item.precio)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button onClick={() => onUpdateQty(item._id, -1)} style={{ background: '#2e2b27', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700, color: '#f0ede8', fontSize: '0.9rem' }}>{item.cantidad}</span>
                        <button onClick={() => onUpdateQty(item._id, 1)} style={{ background: '#2e2b27', border: 'none', borderRadius: 6, width: 26, height: 26, cursor: 'pointer', color: '#f0ede8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <div style={{ minWidth: 60, textAlign: 'right', fontWeight: 700, color: '#f0ede8', fontSize: '0.88rem' }}>
                        {S(item.precio * item.cantidad)}
                      </div>
                      <button onClick={() => onRemove(item._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e85d3a', padding: 2 }}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )
          )}

          {/* ── CHECKOUT ──────────────────────────────────────── */}
          {step === 'checkout' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={label}>Tu nombre *</label>
                <input value={form.nombreCliente} onChange={e => set('nombreCliente', e.target.value)} placeholder="Nombre completo" style={inputStyle} />
              </div>
              <div>
                <label style={label}>Teléfono *</label>
                <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="Ej: 987 654 321" style={inputStyle} />
              </div>

              {/* Tipo de entrega */}
              <div>
                <label style={label}>Tipo de entrega</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[['delivery', '🛵 Delivery'], ['recojo', '🏪 Recojo en tienda']].map(([val, lbl]) => (
                    <button key={val} type="button" onClick={() => set('tipoEntrega', val)} style={{
                      flex: 1, background: form.tipoEntrega === val ? '#f5a62320' : '#211f1c',
                      border: `1px solid ${form.tipoEntrega === val ? '#f5a623' : '#2e2b27'}`,
                      borderRadius: 10, padding: '0.55rem 0.5rem',
                      color: form.tipoEntrega === val ? '#f5a623' : '#8a8680',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem',
                      fontWeight: form.tipoEntrega === val ? 700 : 400, cursor: 'pointer',
                    }}>{lbl}</button>
                  ))}
                </div>
              </div>

              {form.tipoEntrega === 'delivery' && (
                <div>
                  <label style={label}>Dirección de entrega *</label>
                  <input value={form.direccion} onChange={e => set('direccion', e.target.value)} placeholder="Calle, número, referencia" style={inputStyle} />
                </div>
              )}

              {/* Método de pago */}
              <div>
                <label style={label}>Método de pago</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {METODOS.map(m => (
                    <button key={m} type="button" onClick={() => set('metodoPago', m)} style={{
                      background: form.metodoPago === m ? (m === 'credito' ? '#e85d3a' : '#f5a623') : '#211f1c',
                      border: `1px solid ${form.metodoPago === m ? (m === 'credito' ? '#e85d3a' : '#f5a623') : '#2e2b27'}`,
                      borderRadius: 8, padding: '0.35rem 0.65rem', cursor: 'pointer',
                      color: form.metodoPago === m ? '#fff' : '#8a8680',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.8rem',
                      fontWeight: form.metodoPago === m ? 700 : 400,
                    }}>{METODO_EMOJI[m]} {m}</button>
                  ))}
                </div>

                {/* Nota informativa de crédito */}
                {form.metodoPago === 'credito' && (
                  <div style={{ marginTop: '0.6rem', background: '#e85d3a15', border: '1px solid #e85d3a40', borderRadius: 10, padding: '0.7rem 0.9rem', fontSize: '0.8rem', color: '#e85d3a', lineHeight: 1.5 }}>
                    📒 <strong>Pago a crédito (fiado)</strong><br />
                    El monto se registrará como deuda en tu cuenta al momento de recibir el pedido.
                    {user?.deuda > 0 && (
                      <span style={{ display: 'block', marginTop: '0.3rem', color: '#e85d3a', fontWeight: 700 }}>
                        Deuda actual: S/ {(user.deuda).toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label style={label}>Notas (opcional)</label>
                <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
                  placeholder="Instrucciones especiales..." rows={2}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
              </div>

              {/* Resumen de ítems */}
              <div style={{ background: '#211f1c', borderRadius: 12, padding: '0.85rem' }}>
                {cart.map(i => (
                  <div key={i._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#8a8680', marginBottom: '0.3rem' }}>
                    <span>{i.emoji} {i.nombre} × {i.cantidad}</span>
                    <span>{S(i.precio * i.cantidad)}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid #2e2b27', paddingTop: '0.5rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#f5a623' }}>
                  <span>Total</span><span>{S(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        {step !== 'success' && (
          <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #2e2b27', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {step === 'cart' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#8a8680' }}>Total</span>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.2rem', color: '#f5a623', fontWeight: 700 }}>{S(total)}</span>
                </div>
                {!token ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ color: '#8a8680', fontSize: '0.82rem', textAlign: 'center', margin: 0 }}>
                      Iniciá sesión para hacer tu pedido
                    </p>
                    <Link to="/login" style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                      background: '#f5a623', borderRadius: 12, padding: '0.8rem',
                      color: '#0f0e0c', fontWeight: 700, textDecoration: 'none',
                      fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
                    }}>
                      <LogIn size={16} /> Iniciar sesión
                    </Link>
                  </div>
                ) : (
                  <button onClick={() => setStep('checkout')} disabled={cart.length === 0} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                    background: cart.length === 0 ? '#2e2b27' : '#f5a623', border: 'none', borderRadius: 12,
                    padding: '0.8rem', color: cart.length === 0 ? '#8a8680' : '#0f0e0c',
                    fontWeight: 700, cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
                  }}>
                    Continuar <ChevronRight size={16} />
                  </button>
                )}
              </>
            )}

            {step === 'checkout' && (
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button onClick={() => setStep('cart')} style={{
                  flex: 1, background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 12,
                  padding: '0.75rem', color: '#8a8680', cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                }}>Volver</button>
                <button onClick={handleOrder} disabled={saving} style={{
                  flex: 2, background: '#f5a623', border: 'none', borderRadius: 12,
                  padding: '0.75rem', color: '#0f0e0c', fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                  fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem',
                }}>
                  {saving ? 'Enviando...' : `Pedir · ${S(total)}`}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function StorePage() {
  const { user, token } = useAuthStore();
  const isMobile = useIsMobile();
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [cat, setCat]             = useState('');
  const [cart, setCart]           = useState([]);
  const [cartOpen, setCartOpen]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { activo: 'true', limit: 100 };
      if (search) params.search    = search;
      if (cat)    params.categoria = cat;
      const res = await productsAPI.getAll(params);
      setProducts(res.data.data);
    } catch {
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
    }
  }, [search, cat]);

  useEffect(() => { load(); }, [load]);

  const addToCart = (p) => {
    setCart(c => {
      const idx = c.findIndex(i => i._id === p._id);
      if (idx >= 0) return c.map((i, n) => n === idx ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...c, { ...p, cantidad: 1 }];
    });
    toast.success(`${p.emoji} ${p.nombre} agregado`);
  };

  const updateQty = (id, delta) =>
    setCart(c => c.map(i => i._id === id ? { ...i, cantidad: i.cantidad + delta } : i).filter(i => i.cantidad > 0));

  const removeItem = (id) => setCart(c => c.filter(i => i._id !== id));

  const totalItems = cart.reduce((s, i) => s + i.cantidad, 0);

  // Destacados primero, luego resto
  const destacados = products.filter(p => p.destacado);
  const resto      = products.filter(p => !p.destacado);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0e0c', fontFamily: "'DM Sans', sans-serif", color: '#f0ede8' }}>

      {/* Header sticky */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,14,12,0.92)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #2e2b27', padding: isMobile ? '0.6rem 1rem' : '0 2rem',
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
      }}>
        {/* Fila 1 en mobile: logo + acciones */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: isMobile ? 'auto' : 64 }}>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.3rem', flexShrink: 0 }}>
            Mi<span style={{ color: '#f5a623' }}>Tienda</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {user ? (
              <>
                {(user.rol === 'admin' || user.rol === 'empleado') && !isMobile && (
                  <Link to="/dashboard" style={{ color: '#8a8680', textDecoration: 'none', fontSize: '0.82rem', padding: '0.4rem 0.75rem', border: '1px solid #2e2b27', borderRadius: 8 }}>Panel</Link>
                )}
                {/* Deuda del cliente */}
                {user.rol === 'cliente' && user.deuda > 0 && (
                  <div style={{ background: '#e85d3a20', border: '1px solid #e85d3a50', borderRadius: 8, padding: '0.3rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: isMobile ? '0.72rem' : '0.8rem', color: '#e85d3a', fontWeight: 700 }}>
                    📒 {isMobile ? `S/ ${user.deuda.toFixed(2)}` : `Debes S/ ${user.deuda.toFixed(2)}`}
                  </div>
                )}
                {/* Puntos del cliente */}
                {user.rol === 'cliente' && !isMobile && (
                  <div style={{ background: '#f5a62315', border: '1px solid #f5a62330', borderRadius: 8, padding: '0.3rem 0.6rem', fontSize: '0.8rem', color: '#f5a623', fontWeight: 600 }}>
                    ⭐ {user.puntos || 0} pts
                  </div>
                )}
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f5a623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#0f0e0c' }}>
                  {user.nombre?.[0]?.toUpperCase()}
                </div>
              </>
            ) : (
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#8a8680', textDecoration: 'none', fontSize: '0.82rem', padding: '0.35rem 0.7rem', border: '1px solid #2e2b27', borderRadius: 8 }}>
                <LogIn size={13} /> {!isMobile && 'Iniciar sesión'}
              </Link>
            )}
            <button onClick={() => setCartOpen(true)} style={{
              background: totalItems > 0 ? '#f5a623' : '#1a1916',
              border: `1px solid ${totalItems > 0 ? '#f5a623' : '#2e2b27'}`,
              borderRadius: 10, padding: '0.4rem 0.75rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              color: totalItems > 0 ? '#0f0e0c' : '#8a8680', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', fontWeight: totalItems > 0 ? 700 : 400,
            }}>
              <ShoppingCart size={15} />
              {totalItems > 0 ? totalItems : (!isMobile ? 'Carrito' : '')}
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div style={{ position: 'relative', flex: isMobile ? 'none' : 1, maxWidth: isMobile ? '100%' : 400, paddingBottom: isMobile ? '0.4rem' : 0 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#8a8680' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            style={{ ...inputStyle, paddingLeft: '1.9rem', padding: '0.45rem 0.8rem 0.45rem 1.9rem' }} />
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '1rem' : '2rem' }}>

        {/* Banner deuda del cliente */}
        {user?.rol === 'cliente' && user.deuda > 0 && (
          <div style={{ background: '#e85d3a15', border: '1px solid #e85d3a40', borderRadius: 12, padding: '0.8rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem' }}>
              <span style={{ fontSize: '1.1rem' }}>📒</span>
              <div>
                <span style={{ color: '#e85d3a', fontWeight: 700 }}>Tienes una deuda pendiente de S/ {user.deuda.toFixed(2)}</span>
                <span style={{ color: '#8a8680', marginLeft: '0.4rem', fontSize: '0.8rem' }}>— acércate a la tienda o comunícate para regularizarla</span>
              </div>
            </div>
          </div>
        )}

        {/* Filtros categoría */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button onClick={() => setCat('')} style={{
            background: cat === '' ? '#f5a623' : '#1a1916',
            border: `1px solid ${cat === '' ? '#f5a623' : '#2e2b27'}`,
            borderRadius: 20, padding: '0.4rem 1rem', cursor: 'pointer',
            color: cat === '' ? '#0f0e0c' : '#8a8680',
            fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem',
            fontWeight: cat === '' ? 700 : 400,
          }}>Todo</button>
          {CATEGORIAS.map(c => (
            <button key={c} onClick={() => setCat(cat === c ? '' : c)} style={{
              background: cat === c ? '#f5a623' : '#1a1916',
              border: `1px solid ${cat === c ? '#f5a623' : '#2e2b27'}`,
              borderRadius: 20, padding: '0.4rem 1rem', cursor: 'pointer',
              color: cat === c ? '#0f0e0c' : '#8a8680',
              fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', textTransform: 'capitalize',
              fontWeight: cat === c ? 700 : 400,
            }}>{c}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#8a8680' }}>Cargando productos...</div>
        ) : products.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#8a8680' }}>No se encontraron productos</div>
        ) : (
          <>
            {/* Destacados */}
            {!search && !cat && destacados.length > 0 && (
              <section style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', marginBottom: '1rem', color: '#f5a623' }}>
                  ⭐ Destacados
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                  {destacados.map(p => <ProductCard key={p._id} product={p} onAdd={addToCart} />)}
                </div>
              </section>
            )}

            {/* Todos / resto */}
            <section>
              {!search && !cat && destacados.length > 0 && (
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.1rem', marginBottom: '1rem' }}>
                  Todos los productos
                </h2>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {(search || cat ? products : resto).map(p => (
                  <ProductCard key={p._id} product={p} onAdd={addToCart} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Carrito drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onOrderPlaced={() => setCart([])}
        />
      )}
    </div>
  );
}
