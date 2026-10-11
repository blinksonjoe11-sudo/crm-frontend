import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const scheduleRefresh = useCallback((delayMs) => {
    const timer = setTimeout(async () => {
      try {
        const res = await api.refresh();
        localStorage.setItem("crm_token", res.data.access_token);
        scheduleRefresh(13 * 60 * 1000);
      } catch {}
    }, delayMs);

    window.__crm_refresh_timer = timer;
  }, []);

  const clearRefreshTimer = () => {
    if (window.__crm_refresh_timer) {
      clearTimeout(window.__crm_refresh_timer);
      window.__crm_refresh_timer = null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("crm_token");
    if (token) {
      api
        .me()
        .then((res) => {
          setUser(res.data);
          scheduleRefresh(13 * 60 * 1000);
        })
        .catch(() => localStorage.removeItem("crm_token"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      clearRefreshTimer();
      setUser(null);
    };
    window.addEventListener("crm:session-expired", handler);
    return () => window.removeEventListener("crm:session-expired", handler);
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem("crm_token", res.data.access_token);
    setUser(res.data.user);
    scheduleRefresh(13 * 60 * 1000);
    return res;
  };

  const register = async (body) => {
    const res = await api.register(body);
    localStorage.setItem("crm_token", res.data.access_token);
    setUser(res.data.user);
    scheduleRefresh(13 * 60 * 1000);
    return res;
  };

  const logout = async () => {
    clearRefreshTimer();
    try {
      await api.logout();
    } catch {}
    localStorage.removeItem("crm_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
