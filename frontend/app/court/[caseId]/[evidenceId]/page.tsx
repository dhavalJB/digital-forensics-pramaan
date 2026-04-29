"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function CourtVerificationPage() {
  const params = useParams();
  const caseId = params.caseId as string;
  const evidenceId = params.evidenceId as string;

  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!file) return alert("Please select the forensic file for validation.");
    setLoading(true);

    const formData = new FormData();
    formData.append("case_id", caseId);
    formData.append("evidence_id", evidenceId);
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:4000/court/verify", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Verification Engine Error: Could not connect to PRAMAAN Node.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-hidden flex flex-col gap-6 p-4 bg-[#F8FAFC]">
      
      {/* JUDICIAL HEADER */}
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-5 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 font-black rounded uppercase tracking-widest">Authentication Terminal</span>
            <span className="text-[10px] font-mono text-slate-500 font-bold tracking-tighter uppercase">EID_REF: {evidenceId}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Evidence <span className="text-blue-700">Integrity Check</span>
          </h1>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        
        {/* LEFT PANEL: UPLOAD & SPECIFICATIONS */}
        <div className="col-span-4 flex flex-col gap-5">
          <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 italic">Source File Validation</h2>
              <div className="group relative bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-8 hover:border-blue-500 transition-all text-center">
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                   <svg className="w-10 h-10 text-slate-400 mx-auto group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeWidth="1.5"/></svg>
                   <p className="text-xs font-bold text-slate-600">{file ? file.name : "Drop Forensic Image Here"}</p>
                   <p className="text-[10px] text-slate-400 font-medium italic">Supports .RAW, .E01, .ISO, .JPEG</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading}
              className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 ${
                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black text-white'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-white border-white/20 rounded-full animate-spin"></div>
                  Comparing Hashes...
                </>
              ) : (
                <>Verify Immutable Integrity</>
              )}
            </button>
          </div>

          {result?.success && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg space-y-4 border border-slate-800">
               <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest border-b border-slate-700 pb-2">Record Metadata</h3>
               <div className="space-y-3 text-[11px]">
                  <div><span className="text-slate-500 font-bold uppercase text-[9px] block">Custodian</span> <span className="font-bold text-blue-50">{result.evidence.current_owner?.name}</span></div>
                  <div><span className="text-slate-500 font-bold uppercase text-[9px] block">Captured By</span> <span className="font-bold">{result.evidence.collected_by?.name}</span></div>
                  <div className="bg-slate-800 p-2 rounded font-mono text-[10px] text-blue-300">TS: {result.evidence.collected_at}</div>
               </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: RESULTS & VERDICT */}
        <div className="col-span-8 overflow-y-auto custom-scrollbar pr-2 pb-10 space-y-6">
          
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
               <svg className="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth="1"/></svg>
               <p className="text-sm font-black uppercase tracking-widest">Awaiting Verification Submission</p>
            </div>
          ) : (
            <>
              {/* FINAL VERDICT BANNER */}
              <div className={`p-6 rounded-2xl shadow-2xl flex items-center justify-between border-l-[12px] ${
                result.verification.match ? "bg-emerald-600 border-emerald-900" : "bg-rose-600 border-rose-900"
              }`}>
                <div className="text-white">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-1 italic">Judicial Integrity Verdict</h2>
                   <div className="text-3xl font-black uppercase tracking-tighter">
                     {result.verification.match ? "✓ Authenticity Confirmed" : "❌ Integrity Compromised"}
                   </div>
                </div>
                <div className="bg-white/10 p-3 rounded-full backdrop-blur-md">
                   <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     {result.verification.match 
                      ? <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2.5"/>
                      : <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2.5"/>}
                   </svg>
                </div>
              </div>

              {/* ASSET PREVIEW */}
              <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-slate-900 text-white flex justify-between items-center">
                   <h3 className="text-[10px] font-black uppercase tracking-widest italic">Forensic Preview</h3>
                   <span className="text-[10px] font-mono text-slate-500 uppercase">{result.evidence.category}</span>
                </div>
                <div className="h-[400px] bg-slate-100 flex items-center justify-center relative group">
                  {result.evidence.category === "IMAGE" && <img src={`http://localhost:4000/files/${caseId}/files/${result.evidence.file_name}`} className="max-h-full object-contain shadow-2xl" />}
                  {result.evidence.category === "VIDEO" && <video controls className="max-h-full"><source src={`http://localhost:4000/files/${caseId}/files/${result.evidence.file_name}`} /></video>}
                  {result.evidence.category === "AUDIO" && <audio controls className="w-full px-10"><source src={`http://localhost:4000/files/${caseId}/files/${result.evidence.file_name}`} /></audio>}
                  {result.evidence.category === "DOCUMENT" && <a href={`http://localhost:4000/files/${caseId}/files/${result.evidence.file_name}`} target="_blank" className="bg-blue-600 text-white px-8 py-3 rounded-full font-black uppercase text-xs shadow-xl">Open Secured Document</a>}
                </div>
              </div>

              {/* DATA GRIDS */}
              <div className="grid grid-cols-2 gap-6">
                
                {/* CHAIN OF CUSTODY TIMELINE */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 border-b pb-2 italic">Immutable Custody Chain</h3>
                   <div className="space-y-4 relative before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                      {result.chain_of_custody.map((c: any, i: number) => (
                        <div key={i} className="flex gap-4 relative">
                          <div className="w-3 h-3 bg-blue-600 border-2 border-white rounded-full z-10 shadow-sm mt-1"></div>
                          <div className="flex-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                             <div className="font-black text-slate-900 text-[10px] uppercase">{c.event}</div>
                             <div className="text-[10px] text-slate-500 font-bold mt-1">
                                {c.from && `From: ${c.from.name}`} {c.to && `→ To: ${c.to.name}`}
                                {c.by && `Auth: ${c.by.name}`}
                             </div>
                             <div className="text-[8px] font-mono text-slate-400 mt-1">{c.time}</div>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* REPORTS & AUDIT */}
                <div className="space-y-6">
                   <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">Forensic Findings</h3>
                      <div className="space-y-3">
                         {result.reports.map((r: any, i: number) => (
                           <div key={i} className="p-3 bg-blue-50 border-l-4 border-blue-600 rounded-r-lg">
                              <div className="text-[9px] font-black text-blue-700 uppercase mb-1">{r.from?.name} → {r.to?.name}</div>
                              <p className="text-[11px] text-slate-700 leading-relaxed italic">"{r.summary}"</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">System Audit Trail</h3>
                      <div className="space-y-2 h-32 overflow-y-auto custom-scrollbar">
                         {result.audit?.map((a: any, i: number) => (
                           <div key={i} className="text-[9px] border-b border-slate-200 pb-1 flex justify-between">
                              <span className="font-bold text-slate-700 uppercase">{a.action}</span>
                              <span className="font-mono text-slate-400">{a.timestamp}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>

              {/* FINAL LEGAL STATEMENT */}
              <div className="bg-slate-900 p-8 rounded-3xl text-center shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
                 <p className="text-blue-200 font-medium italic text-sm leading-relaxed mb-4">
                    "{result.statement}"
                 </p>
                 <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest italic">Digitally Sealed by PRAMAAN Protocol</span>
                 </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}