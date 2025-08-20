import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem('authTokens') ? 
    JSON.parse(localStorage.getItem('authTokens')) : null
  );
const [user, setUser] = useState(() =>
    localStorage.getItem('authTokens') ? 
    jwtDecode(localStorage.getItem('authTokens')) : null
);

const loginUser = (tokens) => {
    setAuthTokens(tokens);
    setUser(jwtDecode(tokens.access));
    localStorage.setItem('authTokens', JSON.stringify(tokens));
};

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    localStorage.removeItem('authTokens');
  };

  return (
    <AuthContext.Provider value={{ user, authTokens, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
