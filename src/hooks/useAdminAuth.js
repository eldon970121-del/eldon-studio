import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_LUMINA_API || 'https://lumina-server-production.up.railway.app';

function readStoredUser() {
  try {
    const raw = localStorage.getItem('lumina_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useAdminAuth() {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lumina_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    // 验证 token 有效性
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('invalid token');
        return res.json();
      })
      .then(data => {
        const u = data.user ?? data;
        localStorage.setItem('lumina_user', JSON.stringify(u));
        setUser(u);
      })
      .catch(() => {
        localStorage.removeItem('lumina_token');
        localStorage.removeItem('lumina_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const isAdmin =
    user?.email?.toLowerCase() === import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase() ||
    user?.role === 'admin';

  async function signIn(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { data: null, error: new Error(data.message || `HTTP ${res.status}`) };
    }
    if (data.token) localStorage.setItem('lumina_token', data.token);
    if (data.user) {
      localStorage.setItem('lumina_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return { data, error: null };
  }

  async function signOut() {
    localStorage.removeItem('lumina_token');
    localStorage.removeItem('lumina_user');
    setUser(null);
    return { data: null, error: null };
  }

  return { user, isAdmin, loading, signIn, signOut };
}
