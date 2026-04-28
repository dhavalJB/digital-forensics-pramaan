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

  if (loading) return <div>Loading...</div>; // 🔥 WAIT

  if (!session) return null;

  return <Dashboard />;
}