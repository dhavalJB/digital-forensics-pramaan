"use client";

import { useSession } from "../context/SessionContext";

export default function Header() {
  const { session, logout } = useSession();

  if (!session) return null;

  return (
    <div className="h-16 bg-white shadow flex items-center justify-between px-6">
      <div className="font-semibold">
        Digital Evidence System
      </div>

      <div className="flex items-center gap-4">
        <span className="text-green-600 text-sm">
          ● On-Chain Synced
        </span>

        <div className="bg-gray-200 px-3 py-1 rounded text-sm">
          {session.name}
        </div>

        <button
          onClick={logout}
          className="text-red-500 text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
}