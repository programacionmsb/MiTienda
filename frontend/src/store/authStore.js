import { create } from 'zustand';
import { authAPI } from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('token', data.token);
      set({ user: data.user, token: data.token, loading: false });
      return data;
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    if (!get().token) return;
    try {
      const { data } = await authAPI.getMe();
      set({ user: data.user });
    } catch {
      get().logout();
    }
  },

  isAdmin: () => get().user?.rol === 'admin',
  isEmpleado: () => ['admin','empleado'].includes(get().user?.rol),
  isCliente: () => get().user?.rol === 'cliente',
}));

export default useAuthStore;
