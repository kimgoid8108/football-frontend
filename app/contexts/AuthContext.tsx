"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getToken, removeToken } from "../utils/api";

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 토큰이 있으면 인증된 상태로 간주
    const token = getToken();
    if (token) {
      setIsAuthenticated(true);
      // 토큰에서 사용자 정보 추출 (간단한 구현)
      // 실제로는 토큰을 디코딩하거나 API를 호출해야 함
    }
  }, []);

  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
