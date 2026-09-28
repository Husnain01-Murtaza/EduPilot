import { create } from 'zustand';
import api, { errMsg } from '../utils/api';

const saveTokens = ({ token, refreshToken }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('refreshToken', refreshToken);
};

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: false,
  initialized: !localStorage.getItem('token'), // nothing to restore without a token
  error: null,

  authenticate: async (path, payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post(path, payload);
      saveTokens(data);
      set({ user: data.user, token: data.token, isLoading: false, initialized: true });
      return data;
    } catch (e) {
      set({ error: errMsg(e, 'Request failed'), isLoading: false });
      throw e;
    }
  },

  signup: (name, email, password) => get().authenticate('/auth/signup', { name, email, password }),
  login: (email, password) => get().authenticate('/auth/login', { email, password }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    set({ user: null, token: null, initialized: true });
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isLoading: false, initialized: true });
    } catch {
      get().logout();
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
