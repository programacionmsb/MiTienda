import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import ProductsPage from './pages/ProductsPage';
import SalesPage from './pages/SalesPage';
import OrdersPage from './pages/OrdersPage';
import InventoryPage from './pages/InventoryPage';
import StorePage from './pages/StorePage';
import RegisterPage from './pages/RegisterPage';
import Layout from './components/layout/Layout';

// Guard de rutas
const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.rol)) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const { fetchMe, token } = useAuthStore();

  useEffect(() => { if (token) fetchMe(); }, [token]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a1916', color: '#f0ede8', border: '1px solid #2e2b27' },
          success: { iconTheme: { primary: '#3ecf8e', secondary: '#0f0e0c' } },
          error: { iconTheme: { primary: '#e85d3a', secondary: '#0f0e0c' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Tienda pública */}
        <Route path="/tienda" element={<StorePage />} />

        {/* Panel privado */}
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={
            <PrivateRoute roles={['admin','empleado']}>
              <DashboardPage />
            </PrivateRoute>
          } />
          <Route path="productos" element={<ProductsPage />} />
          <Route path="inventario" element={
            <PrivateRoute roles={['admin','empleado']}>
              <InventoryPage />
            </PrivateRoute>
          } />
          <Route path="ventas" element={
            <PrivateRoute roles={['admin','empleado']}>
              <SalesPage />
            </PrivateRoute>
          } />
          <Route path="pedidos" element={<OrdersPage />} />
          <Route path="reportes" element={
            <PrivateRoute roles={['admin']}>
              <ReportsPage />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
