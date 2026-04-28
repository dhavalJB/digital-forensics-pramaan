"use client";

import { useEffect, useState } from "react";
import { useSession } from "../context/SessionContext";
import { useRouter } from "next/navigation";

export default function CasesPage() {
  const { session } = useSession();
  const router = useRouter();

  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.address) return;

    fetch(`http://localhost:4000/cases/${session.address}`)
      .then((res) => res.json())
      .then((data) => setCases(data.cases || []));
  }, [session]);

  return (
    <div className="h-full flex flex-col gap-5 p-2 bg-[#F8FAFC]">

      {/* COMMAND HEADER */}
      <div className="flex justify-between items-center border-b border-slate-300 pb-6 px-2">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Case Registry</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px] font-bold text-blue-600">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
              SECURE LEDGER ACCESS
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Protocol: PRAMAAN-v2</span>
          </div>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm text-right min-w-[180px]">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Indexed Cases</div>
          <div className="text-3xl font-mono font-black text-slate-900 mt-1">{cases.length.toString().padStart(3, '0')}</div>
        </div>
      </div>

      {/* CENTRAL EVIDENCE REPOSITORY */}
      <div className="flex-1 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col">
        
        {/* DATA COLUMN HEADERS */}
        <div className="grid grid-cols-12 px-8 py-4 bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] rounded-t-2xl">
          <div className="col-span-5">Investigation Identity & Location</div>
          <div className="col-span-3 text-center">Reference ID</div>
          <div className="col-span-2 text-center">Operational Status</div>
          <div className="col-span-2 text-right">Vault Items</div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
          {cases.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-30">
              <div className="p-6 bg-slate-100 rounded-full">
                <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Repository Is Currently Empty</p>
            </div>
          ) : (
            cases.map((c, index) => {
              const status = c.meta.status;

              let statusStyle = "bg-slate-200 text-slate-600 border-slate-300";
              if (status === "OPEN") statusStyle = "bg-blue-600 text-white border-blue-700";
              else if (status === "INVESTIGATING") statusStyle = "bg-amber-500 text-white border-amber-600";
              else if (status === "CLOSED") statusStyle = "bg-emerald-600 text-white border-emerald-700";

              return (
                <div
                  key={c.case_id}
                  onClick={() => router.push(`/cases/${c.case_id}`)}
                  className={`grid grid-cols-12 items-center px-8 py-5 cursor-pointer transition-all border-b border-slate-100 group ${
                    index % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'
                  } hover:bg-blue-50/50 hover:border-blue-200`}
                >
                  {/* CASE METADATA */}
                  <div className="col-span-5 space-y-1">
                    <div className="font-black text-slate-900 group-hover:text-blue-700 transition-colors tracking-tight text-sm uppercase">
                      {c.meta.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold italic tracking-tight">
                      <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                      {c.meta.location.place}
                    </div>
                  </div>

                  {/* BLOCKCHAIN REF ID */}
                  <div className="col-span-3 flex justify-center">
                    <span className="font-mono text-[10px] bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm text-slate-600 font-bold tracking-tighter group-hover:border-blue-300 group-hover:text-blue-600 transition-colors">
                      {c.case_id}
                    </span>
                  </div>

                  {/* OPERATIONAL BADGE */}
                  <div className="col-span-2 flex justify-center">
                    <div className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border shadow-sm ${statusStyle}`}>
                      {status}
                    </div>
                  </div>

                  {/* EVIDENCE ANALYTICS */}
                  <div className="col-span-2 text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Encrypted Items</div>
                    <div className="text-lg font-mono font-black text-slate-800 leading-none">{c.evidence.length.toString().padStart(2, '0')}</div>
                    <div className="text-[9px] font-black text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 uppercase italic tracking-tighter">
                      Access Chain →
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AUDIT & SECURITY FOOTER */}
      <div className="flex justify-between items-center px-6 py-3 bg-slate-900 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] shadow-lg border border-slate-800">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 italic">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> 
            Pramaan Ledger Node-04
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-emerald-500/80 tracking-normal font-mono uppercase">Sync_Status: 100% OK</span>
        </div>
        <div className="flex gap-8">
          <span className="text-slate-500 hover:text-white transition-colors cursor-help italic tracking-normal lowercase">hash-verified-recordset</span>
          <span className="text-slate-600 font-bold tracking-tight">© 2026 METAREALM</span>
        </div>
      </div>
    </div>
  );
}