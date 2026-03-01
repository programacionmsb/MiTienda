import { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Clock, CheckCircle, Package, Truck, XCircle } from 'lucide-react';
import { ordersAPI } from '../services/api';
import useAuthStore from '../store/authStore';
import useIsMobile from '../hooks/useIsMobile';
import toast from 'react-hot-toast';

const ESTADOS = ['pendiente', 'aceptado', 'preparando', 'listo', 'entregado', 'cancelado'];

const ESTADO_CFG = {
  pendiente:  { color: '#f5a623', bg: '#f5a62320', icon: Clock,        label: 'Pendiente'  },
  aceptado:   { color: '#6495ED', bg: '#6495ED20', icon: CheckCircle,  label: 'Aceptado'   },
  preparando: { color: '#9b59b6', bg: '#9b59b620', icon: Package,      label: 'Preparando' },
  listo:      { color: '#3ecf8e', bg: '#3ecf8e20', icon: Truck,        label: 'Listo'      },
  entregado:  { color: '#3ecf8e', bg: '#3ecf8e15', icon: CheckCircle,  label: 'Entregado'  },
  cancelado:  { color: '#e85d3a', bg: '#e85d3a20', icon: XCircle,      label: 'Cancelado'  },
};

const SIGUIENTES = {
  pendiente:  ['aceptado', 'cancelado'],
  aceptado:   ['preparando', 'cancelado'],
  preparando: ['listo', 'cancelado'],
  listo:      ['entregado', 'cancelado'],
  entregado:  [],
  cancelado:  [],
};

const METODO_EMOJI = { efectivo: '💵', yape: '📲', plin: '📲', transferencia: '🏦', tarjeta: '💳' };
const S  = (v) => `S/ ${(v || 0).toFixed(2)}`;

const input = {
  background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10,
  padding: '0.5rem 0.75rem', color: '#f0ede8',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none',
};

function EstadoBadge({ estado }) {
  const cfg = ESTADO_CFG[estado] || {};
  return (
    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
      {cfg.label}
    </span>
  );
}

function CambiarEstado({ order, onUpdated }) {
  const siguientes = SIGUIENTES[order.estado] || [];
  const [loading, setLoading] = useState(false);

  if (siguientes.length === 0) return <EstadoBadge estado={order.estado} />;

  const cambiar = async (nuevoEstado) => {
    setLoading(true);
    try {
      await ordersAPI.updateEstado(order._id, nuevoEstado);
      toast.success(`Pedido #${order.numero} → ${nuevoEstado}`);
      onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar estado');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start' }}>
      <EstadoBadge estado={order.estado} />
      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
        {siguientes.map(s => {
          const cfg = ESTADO_CFG[s];
          return (
            <button key={s} onClick={() => cambiar(s)} disabled={loading} style={{
              background: cfg.bg, border: `1px solid ${cfg.color}40`,
              borderRadius: 6, padding: '0.2rem 0.55rem',
              color: cfg.color, fontSize: '0.72rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>→ {cfg.label}</button>
          );
        })}
      </div>
    </div>
  );
}

const Row = ({ label, value, color }) => (
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <span style={{ color: '#8a8680', minWidth: 80, fontSize: '0.83rem' }}>{label}</span>
    <span style={{ color: color || '#f0ede8', fontSize: '0.83rem' }}>{value}</span>
  </div>
);

function OrderDetail({ order, isMobile }) {
  return (
    <div style={{
      padding: '0.75rem 1rem 1.25rem 1rem', background: '#120e0b',
      display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem',
    }}>
      <div>
        <div style={{ fontSize: '0.72rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Productos</div>
        {order.items?.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.83rem', marginBottom: '0.3rem' }}>
            <span style={{ color: '#f0ede8', flex: 1 }}>{it.nombre}</span>
            <span style={{ color: '#8a8680' }}>{it.cantidad} × {S(it.precio)}</span>
            <span style={{ color: '#f5a623', fontWeight: 600 }}>{S(it.subtotal)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#f5a623', borderTop: '1px solid #2e2b27', paddingTop: '0.4rem', marginTop: '0.4rem', fontSize: '0.88rem' }}>
          <span>Total</span><span>{S(order.total)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ fontSize: '0.72rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.1rem' }}>Detalle</div>
        <Row label="Cliente"  value={order.cliente?.nombre || order.nombreCliente || '—'} />
        <Row label="Teléfono" value={order.telefono || '—'} />
        <Row label="Entrega"  value={order.tipoEntrega === 'delivery' ? '🛵 Delivery' : '🏪 Recojo'} />
        {order.tipoEntrega === 'delivery' && order.direccion && <Row label="Dirección" value={order.direccion} />}
        <Row label="Pago"     value={`${METODO_EMOJI[order.metodoPago] || ''} ${order.metodoPago}`} />
        {order.notas && <Row label="Notas" value={order.notas} />}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const isStaff = user?.rol === 'admin' || user?.rol === 'empleado';
  const isMobile = useIsMobile();

  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [total, setTotal]             = useState(0);
  const [estadoFilter, setEstadoFilter] = useState('');
  const [expanded, setExpanded]       = useState(null);
  const [counts, setCounts]           = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (estadoFilter) params.estado = estadoFilter;
      const res = await ordersAPI.getAll(params);
      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch { toast.error('Error cargando pedidos'); }
    finally { setLoading(false); }
  }, [estadoFilter]);

  useEffect(() => {
    if (!isStaff) return;
    Promise.all(
      ['pendiente', 'aceptado', 'preparando', 'listo'].map(e =>
        ordersAPI.getAll({ estado: e, limit: 1 }).then(r => ({ estado: e, count: r.data.total }))
      )
    ).then(results => {
      const c = {};
      results.forEach(r => { c[r.estado] = r.count; });
      setCounts(c);
    }).catch(() => {});
  }, [isStaff, orders]);

  useEffect(() => { load(); }, [load]);

  const fmtDate = (d) => new Date(d).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ padding: isMobile ? '1rem' : '2rem', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '1.5rem' : '1.8rem', margin: 0 }}>Pedidos</h1>
        <p style={{ color: '#8a8680', marginTop: '0.25rem', fontSize: '0.9rem' }}>{isStaff ? 'Gestión de pedidos online' : 'Mis pedidos'}</p>
      </div>

      {/* Cards resumen (staff) */}
      {isStaff && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '0.65rem', marginBottom: '1.5rem' }}>
          {['pendiente', 'aceptado', 'preparando', 'listo'].map(e => {
            const cfg = ESTADO_CFG[e];
            const Icon = cfg.icon;
            return (
              <div key={e} onClick={() => setEstadoFilter(estadoFilter === e ? '' : e)} style={{
                background: estadoFilter === e ? cfg.bg : '#1a1916',
                border: `1px solid ${estadoFilter === e ? cfg.color + '60' : '#2e2b27'}`,
                borderRadius: 14, padding: '0.85rem', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.7rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cfg.label}</span>
                  <Icon size={13} color={cfg.color} />
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.5rem', color: cfg.color }}>{counts[e] ?? '—'}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setEstadoFilter('')} style={{ ...input, cursor: 'pointer', background: estadoFilter === '' ? '#f5a623' : '#211f1c', color: estadoFilter === '' ? '#0f0e0c' : '#8a8680', fontWeight: estadoFilter === '' ? 700 : 400, border: `1px solid ${estadoFilter === '' ? '#f5a623' : '#2e2b27'}`, fontSize: '0.82rem' }}>Todos</button>
        {ESTADOS.map(e => {
          const cfg = ESTADO_CFG[e];
          const active = estadoFilter === e;
          return (
            <button key={e} onClick={() => setEstadoFilter(active ? '' : e)} style={{ ...input, cursor: 'pointer', background: active ? cfg.bg : '#211f1c', color: active ? cfg.color : '#8a8680', border: `1px solid ${active ? cfg.color + '60' : '#2e2b27'}`, fontWeight: active ? 700 : 400, fontSize: '0.82rem' }}>
              {cfg.label}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', color: '#8a8680', fontSize: '0.82rem' }}>{total} pedido{total !== 1 ? 's' : ''}</span>
      </div>

      {/* Lista */}
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>Cargando...</div>
        ) : orders.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#8a8680' }}>
            <Package size={38} style={{ marginBottom: '0.75rem', opacity: 0.25 }} />
            <div>No hay pedidos{estadoFilter ? ` con estado "${estadoFilter}"` : ''}</div>
          </div>
        ) : isMobile ? (
          /* Tarjetas en mobile */
          <div>
            {orders.map((o, i) => {
              const isOpen = expanded === o._id;
              return (
                <div key={o._id} style={{ borderBottom: i < orders.length - 1 ? '1px solid #2e2b27' : 'none' }}>
                  <div style={{ padding: '0.9rem 1rem', cursor: 'pointer' }} onClick={() => setExpanded(isOpen ? null : o._id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', color: '#8a8680', fontSize: '0.8rem' }}>#{String(o.numero || i + 1).padStart(4, '0')}</span>
                        <span style={{ marginLeft: 8, fontWeight: 600, fontSize: '0.9rem' }}>{o.cliente?.nombre || o.nombreCliente || '—'}</span>
                      </div>
                      <span style={{ color: '#f5a623', fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{S(o.total)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: '#8a8680' }}>{o.tipoEntrega === 'delivery' ? '🛵' : '🏪'} {fmtDate(o.createdAt)}</span>
                      </div>
                      {isOpen ? <ChevronUp size={14} color="#8a8680" /> : <ChevronDown size={14} color="#8a8680" />}
                    </div>
                    <div style={{ marginTop: '0.5rem' }} onClick={e => e.stopPropagation()}>
                      {isStaff ? <CambiarEstado order={o} onUpdated={load} /> : <EstadoBadge estado={o.estado} />}
                    </div>
                  </div>
                  {isOpen && <OrderDetail order={o} isMobile={isMobile} />}
                </div>
              );
            })}
          </div>
        ) : (
          /* Tabla en desktop */
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2e2b27' }}>
                  {['#', 'Cliente', 'Items', 'Total', 'Entrega', 'Pago', 'Estado', 'Fecha', ''].map(h => (
                    <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.73rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => {
                  const isOpen = expanded === o._id;
                  return (
                    <>
                      <tr key={o._id} style={{ borderBottom: isOpen ? 'none' : i < orders.length - 1 ? '1px solid #2e2b27' : 'none', cursor: 'pointer' }}
                        onClick={() => setExpanded(isOpen ? null : o._id)}
                        onMouseEnter={e => e.currentTarget.style.background = '#211f1c'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.85rem 1rem', color: '#8a8680', fontFamily: 'monospace', fontSize: '0.85rem' }}>#{String(o.numero || i + 1).padStart(4, '0')}</td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.88rem' }}>
                          <div style={{ fontWeight: 500 }}>{o.cliente?.nombre || o.nombreCliente || '—'}</div>
                          {o.telefono && <div style={{ color: '#8a8680', fontSize: '0.75rem' }}>{o.telefono}</div>}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#8a8680', fontSize: '0.85rem' }}>{o.items?.length} ítem{o.items?.length !== 1 ? 's' : ''}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#f5a623' }}>{S(o.total)}</td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.83rem', color: '#8a8680' }}>{o.tipoEntrega === 'delivery' ? '🛵 Delivery' : '🏪 Recojo'}</td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.83rem', color: '#8a8680' }}>{METODO_EMOJI[o.metodoPago]} {o.metodoPago}</td>
                        <td style={{ padding: '0.85rem 1rem' }} onClick={e => e.stopPropagation()}>
                          {isStaff ? <CambiarEstado order={o} onUpdated={load} /> : <EstadoBadge estado={o.estado} />}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#8a8680', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{fmtDate(o.createdAt)}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>{isOpen ? <ChevronUp size={14} color="#8a8680" /> : <ChevronDown size={14} color="#8a8680" />}</td>
                      </tr>
                      {isOpen && (
                        <tr key={`${o._id}-detail`} style={{ borderBottom: i < orders.length - 1 ? '1px solid #2e2b27' : 'none' }}>
                          <td colSpan={9} style={{ padding: 0 }}>
                            <OrderDetail order={o} isMobile={false} />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
