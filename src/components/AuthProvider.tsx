'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define a simple mock user type
type User = {
  id: string;
  name: string;
  email: string;
} | null;

interface AuthContextType {
  user: User;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  // Initialize with a mock user so the Dashboard doesn't crash
  useEffect(() => {
    setUser({ id: '1', name: 'Demo User', email: 'demo@example.com' });
  }, []);

  const login = () => setUser({ id: '1', name: 'Demo User', email: 'demo@example.com' });
  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useMockAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useMockAuth must be used within AuthProvider");
  return context;
};