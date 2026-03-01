import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ShoppingCart, Package, Users, AlertTriangle } from 'lucide-react';
import { dashboardAPI } from '../services/api';
import useIsMobile from '../hooks/useIsMobile';
import toast from 'react-hot-toast';

const S = (v) => `S/ ${(v || 0).toFixed(2)}`;

const StatCard = ({ label, value, change, icon: Icon, color = '#f5a623', sub }) => (
  <div style={{
    background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, padding: '1.25rem',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
      <span style={{ fontSize: '0.78rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
      <div style={{ background: `${color}20`, borderRadius: 10, padding: '0.4rem' }}>
        <Icon size={16} color={color} />
      </div>
    </div>
    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem', color: '#f0ede8' }}>{value}</div>
    {change !== undefined && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontSize: '0.8rem' }}>
        {change >= 0
          ? <><TrendingUp size={14} color="#3ecf8e" /><span style={{ color: '#3ecf8e' }}>+{change}% vs ayer</span></>
          : <><TrendingDown size={14} color="#e85d3a" /><span style={{ color: '#e85d3a' }}>{change}% vs ayer</span></>}
      </div>
    )}
    {sub && <div style={{ color: '#8a8680', fontSize: '0.78rem', marginTop: '0.25rem' }}>{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10, padding: '0.6rem 0.9rem' }}>
      <div style={{ color: '#8a8680', fontSize: '0.8rem' }}>{label}h</div>
      <div style={{ color: '#f5a623', fontWeight: 700 }}>S/ {payload[0].value?.toFixed(2)}</div>
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    dashboardAPI.get()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Error cargando dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '3rem', color: '#8a8680', textAlign: 'center' }}>Cargando dashboard...</div>;
  if (!data) return null;

  const { ventasHoy, crecimientoHoy, ventasSemana, ventasMes, pedidosPendientes, productosStockBajo, totalClientes, topProductos } = data;

  const horasData = Array.from({ length: 13 }, (_, i) => ({
    hora: i + 7,
    total: Math.random() * 80 + 10,
  }));

  return (
    <div style={{ padding: isMobile ? '1rem' : '2rem', color: '#f0ede8' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? '1.5rem' : '1.8rem' }}>Dashboard</h1>
        <p style={{ color: '#8a8680', marginTop: '0.25rem' }}>
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '140px' : '210px'}, 1fr))`, gap: '0.75rem', marginBottom: '1.5rem' }}>
        <StatCard label="Ventas hoy" value={S(ventasHoy?.total)} change={parseFloat(crecimientoHoy)} icon={TrendingUp} />
        <StatCard label="Tickets hoy" value={ventasHoy?.count || 0} icon={ShoppingCart} color="#3ecf8e" sub={`Prom: ${S((ventasHoy?.total || 0) / (ventasHoy?.count || 1))}`} />
        <StatCard label="Esta semana" value={S(ventasSemana)} icon={TrendingUp} color="#6495ED" />
        <StatCard label="Este mes" value={S(ventasMes)} icon={TrendingUp} color="#f5a623" />
        <StatCard label="Pedidos pend." value={pedidosPendientes} icon={ShoppingCart} color={pedidosPendientes > 0 ? '#f5a623' : '#3ecf8e'} />
        <StatCard label="Stock bajo" value={productosStockBajo} icon={AlertTriangle} color="#e85d3a" sub="A reponer" />
        <StatCard label="Clientes" value={totalClientes} icon={Users} color="#9b59b6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: '1rem' }}>
        {/* Gráfica ventas por hora */}
        <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, padding: '1.5rem' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", marginBottom: '1.5rem', fontSize: '0.95rem' }}>Ventas por hora (hoy)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={horasData} barSize={16}>
              <XAxis dataKey="hora" tick={{ fill: '#8a8680', fontSize: 10 }} tickFormatter={h => `${h}h`} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,166,35,0.06)' }} />
              <Bar dataKey="total" radius={[6,6,0,0]}>
                {horasData.map((entry, i) => (
                  <Cell key={i} fill={i === 6 ? '#f5a623' : '#2e2b27'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top productos */}
        <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, padding: '1.5rem' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", marginBottom: '1.25rem', fontSize: '0.95rem' }}>🏆 Top productos (mes)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(topProductos || []).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: i === 0 ? '#f5a623' : '#2e2b27',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, color: i === 0 ? '#0f0e0c' : '#8a8680', flexShrink: 0,
                }}>{i + 1}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p._id}</div>
                  <div style={{ fontSize: '0.75rem', color: '#8a8680' }}>{p.totalVendido} und · S/ {p.ingresos?.toFixed(2)}</div>
                </div>
              </div>
            ))}
            {(!topProductos || topProductos.length === 0) && (
              <p style={{ color: '#8a8680', fontSize: '0.88rem' }}>Sin datos este mes aún</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
