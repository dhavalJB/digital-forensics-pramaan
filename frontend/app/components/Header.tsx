"use client";

import { useSession } from "../context/SessionContext";

export default function Header() {
  const { session, logout } = useSession();

  if (!session) return null;

  return (
    <div className="h-16 bg-white border border-slate-200 shadow-sm flex items-center justify-between px-6 rounded-xl">
      
      {/* SYSTEM CONTEXT */}
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-slate-900 rounded-full"></div>
        <div>
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">
            Chain of Custody
          </h2>
          <p className="text-[10px] font-mono text-slate-400 leading-none uppercase">
            Forensic Integrity Protocol
          </p>
        </div>
      </div>

      {/* SESSION CONTROLS */}
      <div className="flex items-center gap-6">
        
        {/* NETWORK STATUS */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
            On-Chain Synced
          </span>
        </div>

        {/* USER IDENTIFIER */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">Session User</div>
            <div className="text-sm font-bold text-slate-900 tracking-tight">
              {session.name}
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shadow-inner">
            {session.name?.charAt(0) || "U"}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="h-8 w-[1px] bg-slate-200"></div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 rounded-lg transition-all group"
        >
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-[11px] font-black uppercase tracking-tighter">Terminate</span>
        </button>
      </div>
    </div>
  );
}