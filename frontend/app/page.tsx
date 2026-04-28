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

  if (loading) {
    return (
      <div className="h-screen overflow-hidden bg-[#F4F7FB] flex items-center justify-center text-gray-500">
        Loading...
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="h-full overflow-hidden">
      <Dashboard />
    </div>
  );
}