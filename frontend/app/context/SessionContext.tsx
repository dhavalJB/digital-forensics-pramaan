"use client";
import { createContext, useContext, useState, useEffect } from "react";

const SessionContext = createContext<any>(null);

export function SessionProvider({ children }: any) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true); // 🔥 ADD THIS

  useEffect(() => {
    const saved = localStorage.getItem("session");
    if (saved) setSession(JSON.parse(saved));
    setLoading(false); // 🔥 IMPORTANT
  }, []);

  const login = (data: any) => {
    localStorage.setItem("session", JSON.stringify(data));
    setSession(data);
  };

  const logout = () => {
    localStorage.removeItem("session");
    setSession(null);
  };

  return (
    <SessionContext.Provider value={{ session, login, logout, loading }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => useContext(SessionContext);