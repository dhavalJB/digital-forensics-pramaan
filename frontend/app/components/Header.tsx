"use client";

import { useSession } from "../context/SessionContext";

export default function Header() {
  const { session, logout } = useSession();

  if (!session) return null;

  return (
    <div className="h-16 bg-white rounded-2xl border border-[#E3E8EF] shadow-sm flex items-center justify-between px-6">
      <div className="font-semibold text-[#0F172A]">
        Chain of Custody
      </div>

      <div className="flex items-center gap-4">
        <span className="text-green-600 text-sm flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          On-Chain Synced
        </span>

        <div className="bg-[#F1F5F9] px-3 py-1 rounded-lg text-sm text-[#0F172A]">
          {session.name}
        </div>

        <button
          onClick={logout}
          className="text-red-500 text-sm hover:underline"
        >
          Logout
        </button>
      </div>
    </div>
  );
}