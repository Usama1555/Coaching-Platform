import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../api/auth';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'coaching-platform-token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const response = await getCurrentUser();
    setUser(response.user);
    return response.user;
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem(TOKEN_KEY);

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  function persistSession(sessionToken, sessionUser) {
    localStorage.setItem(TOKEN_KEY, sessionToken);
    setToken(sessionToken);
    setUser(sessionUser);
  }

  async function login(formData) {
    const response = await loginUser(formData);
    persistSession(response.token, response.user);
    return response;
  }

  async function register(formData) {
    const response = await registerUser(formData);
    persistSession(response.token, response.user);
    return response;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      refreshUser,
      setUser,
      logout,
    }),
    [loading, refreshUser, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
