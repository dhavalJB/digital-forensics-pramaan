"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "./context/SessionContext";
import Dashboard from "./components/Dashboard";

export default function Home() {
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.push("/login");
    }
  }, [session, loading]);

  // Forensic Loading State
  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center gap-4">
        {/* Tactical Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        
        <div className="text-center">
          <p className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.3em] animate-pulse">
            Establishing Secure Link
          </p>
          <p className="text-[9px] font-mono text-slate-500 uppercase mt-2">
            Synchronizing with PRAMAAN Node...
          </p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-full w-full overflow-hidden">
      {/* The Dashboard component now renders within the 
          Main Workspace defined in the AppLayout 
      */}
      <Dashboard />
    </div>
  );
}