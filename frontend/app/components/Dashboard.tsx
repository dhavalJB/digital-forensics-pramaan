"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../context/SessionContext";

export default function Dashboard() {
  const { session } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.address) return;

    fetch(`http://localhost:4000/profile/${session.address}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile))
      .catch(() => setProfile(null));

    fetch(`http://localhost:4000/cases/${session.address}`)
      .then((res) => res.json())
      .then((data) => setCases(data.cases || []))
      .catch(() => setCases([]));

    fetch("http://localhost:4000/evidence/incoming", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: session.address }),
    })
      .then((res) => res.json())
      .then((data) => setIncoming(data.success ? data.transfers || [] : []))
      .catch(() => setIncoming([]));
  }, [session]);

  if (!session) return null;

  const totalCases = cases.length;
  const pendingEvidence = cases.filter((c) => c.evidence.length === 0).length;

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] text-slate-900 p-4 gap-4 overflow-hidden">
      
      {/* 1. TOP SECURE BAR */}
      <div className="flex justify-between items-center bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg shadow-inner">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">PRAMAAN <span className="text-blue-400 font-medium">| Evidence Management</span></h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase italic">Secure Chain of Custody System</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-slate-800 rounded-md border border-slate-700">
            <p className="text-[9px] text-slate-500 font-bold uppercase leading-none mb-1">Authenticated Node</p>
            <p className="text-[11px] font-mono text-blue-300">{session.address.substring(0, 16)}...</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">System Live</span>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL GRID */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">

        {/* LEFT CONTROL PANEL */}
        <div className="col-span-3 flex flex-col gap-4 overflow-hidden">
          
          {/* OFFICER CREDENTIALS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Personnel</span>
              <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">{profile?.officer_name || "Accessing..."}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">
                  {profile?.role || "Unit Officer"}
                </span>
              </div>
            </div>
          </div>

          {/* SYSTEM ALERTS */}
          <div className={`p-4 rounded-xl border-l-4 shadow-sm ${pendingEvidence > 0 ? 'bg-amber-50 border-amber-500' : 'bg-blue-50 border-blue-500'}`}>
            <h3 className="text-[10px] font-black text-slate-500 uppercase mb-1">Status Alerts</h3>
            <p className={`text-sm font-bold ${pendingEvidence > 0 ? 'text-amber-800' : 'text-blue-800'}`}>
              {pendingEvidence === 0 
                ? "✓ Chain Integrity Verified" 
                : `⚠ ${pendingEvidence} Integrity Gaps Detected`}
            </p>
          </div>

          {/* INCOMING EVIDENCE TRANSFER */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-[11px] font-black uppercase text-slate-600 tracking-wider font-mono">Incoming Transfers</h3>
              <span className="bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{incoming.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {incoming.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-30 italic">
                  <p className="text-[10px] uppercase font-bold tracking-tighter">Queue Empty</p>
                </div>
              ) : (
                incoming.map((t, i) => (
                  <div key={i} className="group border-b border-slate-100 pb-3 last:border-0 hover:bg-slate-50 p-2 transition-all rounded-lg cursor-pointer" onClick={() => router.push(`/cases/${t.case_id}/evidence/${t.evidence_id}`)}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="font-mono text-blue-600 font-bold tracking-tighter">ID: {t.evidence_id.substring(0, 10)}</span>
                      <span className="text-slate-400 font-bold uppercase text-[9px]">Awaiting</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">Case: {t.case_id}</p>
                    <button className="w-full mt-2 py-1 bg-white border border-slate-300 text-slate-600 text-[10px] font-bold rounded-md hover:bg-slate-900 hover:text-white transition-all uppercase">Verify Transfer</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT ANALYTICS & CASE GRID */}
        <div className="col-span-9 flex flex-col gap-4 overflow-hidden">
          
          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Cases</p>
                <div className="text-3xl font-black text-slate-900 mt-1">{totalCases.toString().padStart(2, '0')}</div>
              </div>
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Required</p>
                <div className="text-3xl font-black text-rose-600 mt-1">{pendingEvidence.toString().padStart(2, '0')}</div>
              </div>
              <div className="h-10 w-10 bg-rose-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Immutable Records</p>
                <div className="text-3xl font-black text-emerald-600 mt-1">{(totalCases - pendingEvidence).toString().padStart(2, '0')}</div>
              </div>
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
            </div>
          </div>

          {/* MAIN EVIDENCE TABLE / GRID */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight font-mono">Active Case Registry</h2>
              <button onClick={() => router.push("/cases")} className="text-xs font-black text-blue-600 hover:underline tracking-tighter uppercase">
                Browse Full Database →
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.slice(0, 12).map((c) => (
                  <div
                    key={c.case_id}
                    onClick={() => router.push(`/cases/${c.case_id}`)}
                    className="relative group bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">#{c.case_id.substring(0, 10)}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${c.evidence.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                    </div>
                    
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors line-clamp-1 mb-1 leading-tight">
                      {c.meta.title}
                    </h4>
                    
                    <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mb-4 truncate">
                      <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                      {c.meta.location.place}
                    </p>

                    <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 font-black uppercase leading-none mb-0.5">Evidence Count</span>
                        <span className="text-xs font-bold text-slate-800 italic">{c.evidence.length} Ledger Items</span>
                      </div>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter group-hover:translate-x-1 transition-transform">
                        Examine →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. SECURITY FOOTER */}
      <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] bg-white px-6 py-2 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <span>Metarealm-Engine-v3</span>
          <span className="text-slate-300 font-light">|</span>
          <span>Security Protocol: AES-256</span>
        </div>
        <div className="flex gap-6 italic">
          <span className="text-blue-500">Hash-Linked Verified</span>
          <span className="text-emerald-500">Immutable Ledger</span>
        </div>
      </div>
    </div>
  );
}