import { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Download, Package, TrendingUp, ShoppingCart, CreditCard, BarChart2 } from 'lucide-react';
import { reportsAPI, salesAPI, downloadBlob } from '../services/api';
import toast from 'react-hot-toast';

const S = (v) => `S/ ${(v || 0).toFixed(2)}`;

const METODO_COLOR = {
  efectivo:      '#3ecf8e',
  yape:          '#6495ED',
  plin:          '#9b59b6',
  transferencia: '#f5a623',
  tarjeta:       '#e85d3a',
};

const inputStyle = {
  background: '#211f1c', border: '1px solid #2e2b27', borderRadius: 10,
  padding: '0.55rem 0.85rem', color: '#f0ede8',
  fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem', outline: 'none',
};

// ── Card de descarga ───────────────────────────────────────────────────────
function DownloadCard({ icon: Icon, title, description, color, onDownload, loading }) {
  return (
    <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ background: `${color}20`, borderRadius: 12, padding: '0.7rem', flexShrink: 0 }}>
          <Icon size={20} color={color} />
        </div>
        <div>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.97rem', margin: 0 }}>{title}</h3>
          <p style={{ color: '#8a8680', fontSize: '0.82rem', margin: '0.3rem 0 0', lineHeight: 1.5 }}>{description}</p>
        </div>
      </div>
      <button onClick={onDownload} disabled={loading} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        background: loading ? '#2e2b27' : color, color: loading ? '#8a8680' : '#0f0e0c',
        border: 'none', borderRadius: 10, padding: '0.65rem 1rem',
        fontWeight: 700, fontSize: '0.88rem', fontFamily: "'DM Sans', sans-serif",
        cursor: loading ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s',
        opacity: loading ? 0.8 : 1,
      }}>
        <Download size={15} />
        {loading ? 'Generando...' : 'Descargar'}
      </button>
    </div>
  );
}

// ── Barra de porcentaje ────────────────────────────────────────────────────
function BarRow({ label, value, total, color }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
        <span style={{ color: '#f0ede8', textTransform: 'capitalize' }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{S(value)} <span style={{ color: '#8a8680', fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
      </div>
      <div style={{ height: 5, background: '#2e2b27', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// ── Panel de preview ──────────────────────────────────────────────────────
function Preview({ desde, hasta }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setData(null);
    const params = { limit: 500 };
    if (desde) params.desde = desde;
    if (hasta) params.hasta = hasta;

    salesAPI.getAll(params)
      .then(res => {
        const sales = res.data.data;
        const totalVentas    = sales.reduce((s, v) => s + v.total, 0);
        const ticketPromedio = sales.length ? totalVentas / sales.length : 0;
        const totalDescuentos = sales.reduce((s, v) => s + (v.descuento || 0), 0);

        // Por método de pago
        const porMetodo = {};
        sales.forEach(v => {
          porMetodo[v.metodoPago] = (porMetodo[v.metodoPago] || 0) + v.total;
        });

        // Top productos
        const prodCount = {};
        sales.forEach(v => {
          v.items?.forEach(it => {
            if (!prodCount[it.nombre]) prodCount[it.nombre] = { total: 0, cantidad: 0 };
            prodCount[it.nombre].total    += it.subtotal;
            prodCount[it.nombre].cantidad += it.cantidad;
          });
        });
        const topProductos = Object.entries(prodCount)
          .sort((a, b) => b[1].total - a[1].total)
          .slice(0, 5);

        setData({ sales, totalVentas, ticketPromedio, totalDescuentos, porMetodo, topProductos });
      })
      .catch(() => toast.error('Error cargando datos del período'))
      .finally(() => setLoading(false));
  }, [desde, hasta]);

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#8a8680', fontSize: '0.88rem' }}>Cargando datos...</div>
  );
  if (!data) return null;

  const { sales, totalVentas, ticketPromedio, totalDescuentos, porMetodo, topProductos } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
        {[
          { label: 'Ingresos',       value: S(totalVentas),    color: '#f5a623', icon: TrendingUp    },
          { label: 'Tickets',        value: sales.length,      color: '#3ecf8e', icon: ShoppingCart  },
          { label: 'Ticket promedio',value: S(ticketPromedio), color: '#6495ED', icon: BarChart2     },
          { label: 'Descuentos',     value: S(totalDescuentos),color: '#e85d3a', icon: CreditCard    },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 14, padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.73rem', color: '#8a8680', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              <Icon size={13} color={color} />
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.35rem', color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Por método de pago */}
        <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, padding: '1.25rem' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.92rem', margin: '0 0 1rem', color: '#f0ede8' }}>
            Ventas por método de pago
          </h3>
          {Object.keys(porMetodo).length === 0
            ? <p style={{ color: '#8a8680', fontSize: '0.85rem' }}>Sin datos</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {Object.entries(porMetodo)
                  .sort((a, b) => b[1] - a[1])
                  .map(([metodo, valor]) => (
                    <BarRow key={metodo} label={metodo} value={valor} total={totalVentas} color={METODO_COLOR[metodo] || '#f5a623'} />
                  ))}
              </div>
            )}
        </div>

        {/* Top productos */}
        <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16, padding: '1.25rem' }}>
          <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: '0.92rem', margin: '0 0 1rem', color: '#f0ede8' }}>
            Top 5 productos
          </h3>
          {topProductos.length === 0
            ? <p style={{ color: '#8a8680', fontSize: '0.85rem' }}>Sin datos</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {topProductos.map(([nombre, stats], i) => (
                  <div key={nombre} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                      background: i === 0 ? '#f5a623' : '#2e2b27',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700,
                      color: i === 0 ? '#0f0e0c' : '#8a8680',
                    }}>{i + 1}</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#f0ede8' }}>{nombre}</div>
                      <div style={{ fontSize: '0.73rem', color: '#8a8680' }}>{stats.cantidad} und · {S(stats.total)}</div>
                    </div>
                    <BarRow label="" value={stats.total} total={topProductos[0][1].total} color="#f5a623" />
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function ReportsPage() {
  const [dates, setDates]   = useState({ desde: '', hasta: '' });
  const [loading, setLoading] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const download = async (key, fn, filename) => {
    setLoading(l => ({ ...l, [key]: true }));
    try {
      const res = await fn();
      downloadBlob(res.data, filename);
      toast.success('Reporte descargado');
    } catch {
      toast.error('Error al generar reporte');
    } finally {
      setLoading(l => ({ ...l, [key]: false }));
    }
  };

  const params = { desde: dates.desde, hasta: dates.hasta };

  return (
    <div style={{ padding: '2rem', color: '#f0ede8', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.8rem', margin: 0 }}>Reportes</h1>
        <p style={{ color: '#8a8680', marginTop: '0.25rem', fontSize: '0.9rem' }}>Exportá datos y visualizá resúmenes por período</p>
      </div>

      {/* Filtro de fechas */}
      <div style={{
        background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 16,
        padding: '1.25rem 1.5rem', marginBottom: '1.75rem',
        display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
      }}>
        <span style={{ color: '#8a8680', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Período</span>
        <input type="date" value={dates.desde}
          onChange={e => setDates(d => ({ ...d, desde: e.target.value }))}
          style={inputStyle} />
        <span style={{ color: '#8a8680' }}>→</span>
        <input type="date" value={dates.hasta}
          onChange={e => setDates(d => ({ ...d, hasta: e.target.value }))}
          style={inputStyle} />
        <span style={{ color: '#8a8680', fontSize: '0.8rem', marginRight: 'auto' }}>
          (Vacío = todos los registros)
        </span>
        <button onClick={() => setShowPreview(v => !v)} style={{
          background: showPreview ? '#f5a62320' : '#211f1c',
          border: `1px solid ${showPreview ? '#f5a623' : '#2e2b27'}`,
          borderRadius: 10, padding: '0.55rem 1rem',
          color: showPreview ? '#f5a623' : '#8a8680',
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
          fontWeight: showPreview ? 700 : 400,
        }}>
          <BarChart2 size={15} />
          {showPreview ? 'Ocultar preview' : 'Ver preview'}
        </button>
      </div>

      {/* Preview de datos */}
      {showPreview && (
        <div style={{ marginBottom: '1.75rem' }}>
          <Preview desde={dates.desde} hasta={dates.hasta} />
        </div>
      )}

      {/* Cards de descarga */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <DownloadCard
          icon={FileText} color="#e85d3a"
          title="Ventas en PDF"
          description="Reporte detallado con totales, ticket promedio y resumen por cajero."
          loading={loading.ventasPDF}
          onDownload={() => download('ventasPDF', () => reportsAPI.ventasPDF(params), `ventas-${Date.now()}.pdf`)}
        />
        <DownloadCard
          icon={FileSpreadsheet} color="#3ecf8e"
          title="Ventas en Excel"
          description="Todas las ventas del período con columnas para análisis avanzado."
          loading={loading.ventasExcel}
          onDownload={() => download('ventasExcel', () => reportsAPI.ventasExcel(params), `ventas-${Date.now()}.xlsx`)}
        />
        <DownloadCard
          icon={Package} color="#f5a623"
          title="Inventario en Excel"
          description="Productos con stock, costos, precios, márgenes y valor total."
          loading={loading.inventarioExcel}
          onDownload={() => download('inventarioExcel', () => reportsAPI.inventarioExcel(), `inventario-${Date.now()}.xlsx`)}
        />
      </div>

      {/* Nota */}
      <div style={{ background: '#1a1916', border: '1px solid #2e2b27', borderRadius: 14, padding: '1rem 1.25rem' }}>
        <div style={{ fontSize: '0.82rem', color: '#8a8680', lineHeight: 1.8 }}>
          <span style={{ color: '#f0ede8', fontWeight: 600 }}>Notas: </span>
          Los reportes de ventas respetan el período seleccionado. El reporte de inventario siempre refleja el estado actual del stock. El PDF incluye resumen ejecutivo. Los Excel incluyen hoja de resumen separada.
        </div>
      </div>
    </div>
  );
}
