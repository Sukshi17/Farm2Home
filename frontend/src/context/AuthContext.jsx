import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API = axios.create({ baseURL: '/api' });

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('farm2home_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('farm2home_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = localStorage.getItem('farm2home_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await API.post('/auth/verify-token', { token: savedToken });
        setUser(res.data.user);
        setToken(savedToken);
      } catch {
        localStorage.removeItem('farm2home_token');
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  const login = (userData, tokenVal) => {
    setUser(userData);
    setToken(tokenVal);
    localStorage.setItem('farm2home_token', tokenVal);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('farm2home_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export { API };
