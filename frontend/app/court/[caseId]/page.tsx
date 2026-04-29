"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CourtCasePage() {
    const { caseId } = useParams();
    const router = useRouter();

    const [caseData, setCaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showHeavy, setShowHeavy] = useState(false);

    useEffect(() => {
        if (!caseId) return;
        setLoading(true);
        fetch(`http://localhost:4000/court/full-case/${caseId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setCaseData(data.case);
                } else {
                    setCaseData(null);
                }
            })
            .catch(() => setCaseData(null))
            .finally(() => setLoading(false));
    }, [caseId]);

    useEffect(() => {
        if (caseData) {
            setTimeout(() => setShowHeavy(true), 150);
        }
    }, [caseData]);

    if (loading) return (
        <div className="h-full flex items-center justify-center bg-slate-50 font-mono text-slate-400 animate-pulse uppercase tracking-widest">
            Establishing Secure Link...
        </div>
    );

    if (!caseData) return (
        <div className="h-full flex items-center justify-center bg-slate-50 text-rose-600 font-bold uppercase tracking-tighter">
            Error: Forensic Case Index Not Found
        </div>
    );

    return (
        <div className="h-full overflow-hidden flex flex-col gap-6 p-4 bg-[#F1F5F9]">

            {/* JUDICIAL HEADER */}
            <div className="flex justify-between items-end border-b-2 border-slate-900 pb-5 px-2">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 font-black rounded uppercase tracking-widest">Judicial Record</span>
                        <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-tighter">REF_ID: {caseId}</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                        {caseData.meta?.title || "Untitled Record"}
                    </h1>
                </div>
                <div className="text-right">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Blockchain Integrity</div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-tighter">Verified on PRAMAAN</span>
                    </div>
                </div>
            </div>

            {/* TRIPLE PANEL COURT GRID */}
            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">

                {/* LEFT PANEL: CASE SPECS & PERSONNEL */}
                <div className="col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
                    
                    {/* CASE METADATA */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Record Metadata</h3>
                        <div className="text-xs space-y-3 leading-relaxed">
                            <p className="text-slate-700 font-medium italic">"{caseData.meta?.description}"</p>
                            <div className="grid grid-cols-1 gap-2 border-t pt-3">
                                <div><span className="text-[9px] font-black text-slate-400 uppercase block">Category</span> <span className="font-bold text-slate-900 uppercase">{caseData.meta?.case_type}</span></div>
                                <div><span className="text-[9px] font-black text-slate-400 uppercase block">Status</span> <span className="font-bold text-blue-600">{caseData.meta?.status}</span></div>
                                <div><span className="text-[9px] font-black text-slate-400 uppercase block">Spatial Marker</span> <span className="font-bold text-slate-900">{caseData.meta?.location?.city}, {caseData.meta?.location?.state}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* OFFICER IN CHARGE */}
                    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                             <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" /></svg>
                        </div>
                        <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">Lead Investigative Authority</h3>
                        <div className="text-lg font-black tracking-tight leading-none">{caseData.officers?.investigating_officer?.name}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase mt-2 italic tracking-tighter">
                            {caseData.officers?.investigating_officer?.rank} // {caseData.officers?.investigating_officer?.department}
                        </div>
                    </div>

                    {/* TEAM ROSTER */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Assigned Forensic Team</h3>
                        <div className="space-y-2">
                            {(caseData.members || []).map((m: any, i: number) => (
                                <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <div className="text-xs font-bold text-slate-900">{m.profile?.name}</div>
                                    <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{m.role}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CENTER PANEL: EVIDENCE & SUBMISSIONS */}
                <div className="col-span-5 flex flex-col gap-6 overflow-hidden">
                    
                    {/* EVIDENCE REPOSITORY */}
                    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col flex-1 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center">
                             <h2 className="text-[11px] font-black uppercase tracking-[0.2em] italic">Forensic Evidence Inventory</h2>
                             <span className="bg-blue-600 text-[10px] px-2 py-0.5 rounded font-black">{caseData.evidence?.length || 0} ITEMS</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {!showHeavy ? (
                                <div className="h-full flex items-center justify-center italic text-slate-400 text-xs uppercase tracking-tighter animate-pulse">Decrypting Object Ledger...</div>
                            ) : (
                                (caseData.evidence || []).map((e: any) => (
                                    <div
                                        key={e.evidence_id}
                                        onClick={() => router.push(`/court/${caseId}/${e.evidence_id}`)}
                                        className="group border-2 border-slate-50 p-4 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 hover:shadow-md transition-all flex justify-between items-center"
                                    >
                                        <div className="space-y-1">
                                            <div className="font-mono font-black text-blue-700 text-[11px]">#{e.evidence_id.substring(0, 16)}...</div>
                                            <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{e.category} <span className="text-slate-300 mx-1">//</span> {e.type}</div>
                                            <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Source: {e.collected_by_profile?.name}</div>
                                        </div>
                                        <div className="text-right">
                                             <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Current Custodian</div>
                                             <div className="text-[10px] font-bold text-slate-800 italic">{e.ownership?.current_owner_profile?.name || "Registry Link"}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* FORENSIC REPORTS */}
                    <div className="bg-white border border-slate-200 rounded-2xl flex flex-col h-1/3 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                             <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">Judicial Findings & Reports</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {!showHeavy ? <div className="text-slate-300 italic text-[10px] uppercase">Loading Reports...</div> : (
                                (caseData.reports || []).map((r: any, i: number) => (
                                    <div key={i} className="border-l-4 border-blue-600 bg-slate-50 p-3 rounded-r-lg space-y-2 shadow-sm">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                            <div className="font-black text-slate-900 text-[10px] uppercase">{r.from_profile?.name} → {r.to_profile?.name}</div>
                                            <div className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">{r.submitted_at}</div>
                                        </div>
                                        <div className="text-[11px] text-slate-700 leading-relaxed font-medium italic">
                                            "{r.report?.summary}"
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: IMMUTABLE TIMELINE */}
                <div className="col-span-4 flex flex-col gap-4 overflow-hidden">
                    <div className="bg-white border-2 border-slate-900 rounded-2xl flex-1 shadow-2xl flex flex-col overflow-hidden">
                        <div className="px-5 py-4 bg-slate-900 text-blue-400 flex justify-between items-center">
                             <h2 className="text-[11px] font-black uppercase tracking-[0.2em] italic">Chain of Custody</h2>
                             <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                             {!showHeavy ? (
                                <div className="space-y-4">
                                    {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-50 animate-pulse rounded-xl"></div>)}
                                </div>
                             ) : (
                                <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                                    {(caseData.timeline || []).map((t: any, i: number) => (
                                        <div key={i} className="flex gap-4 relative">
                                            <div className="w-4 h-4 bg-blue-600 border-4 border-white rounded-full z-10 shadow-sm mt-1"></div>
                                            <div className="flex-1 bg-slate-50/50 border border-slate-100 p-3 rounded-xl hover:border-blue-400 transition-colors">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div className="font-black text-blue-700 text-[10px] uppercase tracking-tighter">{t.type}</div>
                                                    <div className="text-[9px] font-mono text-slate-400 uppercase">{t.timestamp}</div>
                                                </div>
                                                {t.by_profile && (
                                                    <div className="text-[11px] font-bold text-slate-900 uppercase">Auth: {t.by_profile.name}</div>
                                                )}
                                                <div className="mt-2 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    {t.from_profile && <span>FROM: {t.from_profile.name}</span>}
                                                    {t.to_profile && <span>→ TO: {t.to_profile.name}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>
                    </div>

                    {/* SYSTEM INTEGRITY BANNER */}
                    <div className="bg-blue-600 text-white rounded-2xl p-4 flex items-center justify-center gap-3 shadow-lg border-b-4 border-blue-800">
                        <svg className="w-5 h-5 text-blue-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] leading-none">Record Immutable & Secured</div>
                    </div>
                </div>
            </div>
        </div>
    );
}