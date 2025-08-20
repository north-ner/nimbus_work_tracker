import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() => {
    const stored = localStorage.getItem('authTokens');
    return stored ? JSON.parse(stored) : null;
  });

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('authTokens');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return jwtDecode(parsed.access);
    } catch {
      return null;
    }
  });

  const loginUser = (tokens) => {
    setAuthTokens(tokens);
    try {
      const decoded = jwtDecode(tokens.access);
      setUser(decoded);
    } catch {
      setUser(null);
    }
    localStorage.setItem('authTokens', JSON.stringify(tokens));
  };

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
  };

  // Keep user in sync if tokens change externally
  useEffect(() => {
    if (authTokens?.access) {
      try {
        setUser(jwtDecode(authTokens.access));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [authTokens]);

  return (
    <AuthContext.Provider value={{ user, authTokens, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
