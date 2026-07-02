import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('accessToken');
    if (!t) { setLoading(false); return; }
    api.get('/auth/profile').then(({ data }) => {
      setUser({ id: data._id, name: data.name, email: data.email, role: data.role });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };
  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  const can = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'manager') {
      return ['users.view', 'receipt.viewAll', 'receipt.create', 'receipt.edit', 'voucher.viewAll', 'voucher.create', 'voucher.edit', 'dashboard.view'].includes(permission);
    }
    if (user.role === 'user') {
      return ['receipt.viewAll', 'receipt.create', 'receipt.edit', 'voucher.viewAll', 'voucher.create', 'voucher.edit', 'dashboard.view'].includes(permission);
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, can }}>
      {children}
    </AuthContext.Provider>
  );
}