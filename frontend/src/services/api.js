import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar 401 globalmente
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  getUsers: (params) => api.get('/auth/users', { params }),
  createUser: (data) => api.post('/auth/users', data),
  updateUser: (id, data) => api.patch(`/auth/users/${id}`, data),
};

// ─── Products ──────────────────────────────────────────────
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  adjustStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getAlertas: () => api.get('/products/alertas/stock'),
};

// ─── Sales ─────────────────────────────────────────────────
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  create: (data) => api.post('/sales', data),
  getResumen: () => api.get('/sales/resumen'),
  getDeudores: () => api.get('/sales/deudores'),
  cobro: (data) => api.post('/sales/cobro', data),
};

// ─── Orders ────────────────────────────────────────────────
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  updateEstado: (id, estado) => api.patch(`/orders/${id}/estado`, { estado }),
};

// ─── Dashboard ─────────────────────────────────────────────
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// ─── Reports ───────────────────────────────────────────────
export const reportsAPI = {
  ventasPDF: (params) => api.get('/reports/ventas/pdf', { params, responseType: 'blob' }),
  ventasExcel: (params) => api.get('/reports/ventas/excel', { params, responseType: 'blob' }),
  inventarioExcel: () => api.get('/reports/inventario/excel', { responseType: 'blob' }),
};

// Helper: descargar blob
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default api;
