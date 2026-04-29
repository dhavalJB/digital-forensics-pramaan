"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CourtHome() {
  const [caseId, setCaseId] = useState("");
  const router = useRouter();

  const openCase = () => {
    if (!caseId) {
      alert("Please provide a valid Forensic Case Identifier.");
      return;
    }
    router.push(`/court/${caseId}`);
  };

  return (
    <div className="h-full flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* TOP ACCENT DECOR */}
        <div className="h-2 w-full bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900"></div>

        <div className="p-10 space-y-8">
          {/* LOGO & TITLE SECTION */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="bg-slate-900 p-4 rounded-2xl shadow-xl border border-slate-700">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Court <span className="text-blue-700">Verification</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em]">
              Blockchain Evidence Authentication Portal
            </p>
          </div>

          {/* INPUT FIELD CONTAINER */}
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                placeholder="Enter Encrypted Case ID (e.g. 0x...)"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                className="w-full pl-12 pr-4 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-mono placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner"
              />
            </div>

            <button
              onClick={openCase}
              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 group"
            >
              <span>Authenticate Record</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>

          {/* FOOTER NOTICE */}
          <div className="pt-6 border-t border-slate-100 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
                PRAMAAN Network: Live Verified
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 leading-relaxed font-medium italic">
              All data access is logged and anchored to the Metarealm chain <br />
              to ensure absolute chain-of-custody integrity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}