import { createContext, useContext, useState, ReactNode } from "react";
import { api } from "@/lib/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  email: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("finwise_token"));
  const [email, setEmail] = useState<string | null>(localStorage.getItem("finwise_email"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(emailInput: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/auth/login", { email: emailInput, password });
      localStorage.setItem("finwise_token", res.data.token);
      localStorage.setItem("finwise_email", res.data.user.email);
      setToken(res.data.token);
      setEmail(res.data.user.email);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed. Please check your credentials.");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("finwise_token");
    localStorage.removeItem("finwise_email");
    setToken(null);
    setEmail(null);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!token, email, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
