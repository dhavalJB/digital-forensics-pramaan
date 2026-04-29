"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";

export default function CaseDetail() {
  const router = useRouter();
  const { id } = useParams();
  const { session } = useSession();

  const [caseData, setCaseData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:4000/case/${id}`)
      .then((res) => res.json())
      .then((data) => setCaseData(data.case));

    if (session?.address) {
      fetch(`http://localhost:4000/profile/${session.address}`)
        .then((res) => res.json())
        .then((data) => setProfile(data.profile));
    }
  }, [id, session]);

  const handleUpload = async () => {
    if (!file) return alert("Select file");
    if (!session?.address) return alert("Session missing");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("case_id", id as string);
    formData.append("officer", session.address);

    try {
      const res = await fetch("http://localhost:4000/evidence/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert("Evidence Anchored Successfully");
        window.location.reload();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Encryption/Upload failed");
    }
  };

  const formatDate = (val: any) => {
    if (!val) return "—";
    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (!caseData) return (
    <div className="h-full flex items-center justify-center font-mono text-slate-400 animate-pulse">
      DECRYPTING_SECURE_RECORDS...
    </div>
  );

  const getName = (val: any) =>
    typeof val === "object" ? val?.officer_name || val?.name || "Unknown" : val;

  return (
    <div className="h-full overflow-hidden flex flex-col gap-5 p-2 bg-[#F8FAFC]">

      {/* HEADER: IMMEDIATE CONTEXT */}
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-5 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-slate-900 text-white px-2 py-0.5 font-black uppercase rounded tracking-widest">Forensic File</span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">CASE_ID: {id}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            {caseData.meta.title}
          </h1>
          <div className="text-[11px] font-bold text-blue-600 flex items-center gap-1.5 mt-2 italic">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" /></svg>
            {caseData.meta.location.place} // {caseData.meta.location.city}
          </div>
        </div>

        <div className={`px-6 py-2 text-sm font-black rounded-lg border-2 uppercase tracking-[0.2em] shadow-sm ${caseData.meta.status === 'OPEN' ? 'bg-blue-600 text-white border-blue-700' : 'bg-emerald-600 text-white border-emerald-700'
          }`}>
          {caseData.meta.status}
        </div>
      </div>

      {/* THREE-PANEL OPERATIONAL GRID */}
      <div className="flex-1 grid grid-cols-12 gap-5 overflow-hidden">

        {/* LEFT PANEL: CASE PARAMETERS */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">

          {/* QUICK SUMMARY */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">Case Intelligence</h3>
            <div className="space-y-3 text-[11px]">
              <div><span className="text-slate-400 font-bold block mb-1">BRIEF:</span> <p className="text-slate-700 leading-relaxed font-medium">{caseData.meta.description}</p></div>
              <div className="grid grid-cols-2 gap-2 mt-4 font-bold">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[9px] text-slate-400 block uppercase">Type</span>
                  {caseData.meta.case_type}
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[9px] text-slate-400 block uppercase">Priority</span>
                  <span className="text-rose-600 uppercase">{caseData.meta.priority}</span>
                </div>
              </div>
            </div>
          </div>

          {/* GEOSPATIAL DATA */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-[11px]">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 italic">Geo-Spatial Origin</h3>
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100 font-bold text-slate-800">
              <div>{caseData.meta.location.place}</div>
              <div className="text-blue-600">{caseData.meta.location.platform}</div>
              <div className="text-slate-500 uppercase text-[9px] font-black">{caseData.meta.location.city}, {caseData.meta.location.state}, {caseData.meta.location.country}</div>
            </div>
          </div>

          {/* TEMPORAL LOGS */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-[11px]">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Temporal Markers</h3>
            <div className="space-y-2 font-mono font-bold">
              <div className="flex justify-between p-2 bg-slate-50 rounded"><span>INCIDENT:</span> <span className="text-slate-900">{caseData.meta.incident_time}</span></div>
              <div className="flex justify-between p-2 bg-slate-50 rounded"><span>CREATED:</span> <span className="text-slate-900">{caseData.meta.created_at}</span></div>
            </div>
          </div>

          {/* OFFICER & TEAM */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-lg">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Investigative Unit</h3>
            <div className="mb-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <span className="text-slate-500 text-[9px] block uppercase font-black mb-1">Lead Investigator</span>
              {(() => {
                const p = caseData.officers?.investigating_officer;
                return (
                  <div>
                    <div className="text-sm font-bold text-blue-50 tracking-tight">{p?.officer_name || p?.name || "Unknown"}</div>
                    <div className="text-[10px] text-blue-400 font-bold uppercase mt-1 italic">{p?.rank} // {p?.department}</div>
                    <div className="text-[9px] font-mono text-slate-500 break-all mt-2">{p?.address}</div>
                  </div>
                );
              })()}
            </div>

            <div className="space-y-3">
              <span className="text-slate-500 text-[9px] block uppercase font-black px-1">Active Team Members</span>
              {(caseData.members || []).map((m: any, i: number) => {
                const p = m.profile;
                return (
                  <div key={i} className="bg-slate-800 p-2 rounded border border-slate-700 group hover:border-blue-500 transition-colors">
                    <div className="font-bold text-[10px] flex justify-between">
                      <span>{p?.officer_name || p?.name || "Unknown"}</span>
                      <span className="text-blue-400 uppercase text-[9px]">{m.role || p?.role}</span>
                    </div>
                    <div className="text-slate-500 text-[9px] mt-1 font-medium">{p?.rank} • {p?.department}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BLOCKCHAIN GENESIS */}
          <div className="bg-blue-600 text-white rounded-xl p-4 shadow-lg border-b-4 border-blue-800">
            <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-3 flex items-center gap-2">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 11V5a1 1 0 112 0v6a1 1 0 11-2 0z" /></svg>
              Blockchain Proof
            </h3>
            <div className="space-y-2 font-mono text-[9px] leading-tight break-all">
              <div className="bg-blue-700/50 p-2 rounded">TX: {caseData.chain_proof.case_creation.tx_hash}</div>
              <div className="bg-blue-700/50 p-2 rounded">HASH: {caseData.chain_proof.case_creation.data_hash}</div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: EVIDENCE & ANALYTICS */}
        <div className="col-span-5 flex flex-col gap-5 overflow-hidden">

          {/* EVIDENCE VAULT */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col flex-1 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 flex justify-between items-center text-white">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] italic">Evidence Ledger</h2>
              <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-black">{caseData.evidence?.length || 0} UNITS</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {(caseData.evidence || []).map((e: any) => (
                <div key={e.evidence_id} onClick={() => router.push(`/cases/${id}/evidence/${e.evidence_id}`)}
                  className="group bg-white border-2 border-slate-100 p-4 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-mono font-black text-xs text-blue-700 tracking-tighter">#{e.evidence_id.substring(0, 16)}...</div>
                    <div className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${e.tx_hash ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 animate-pulse"}`}>
                      {e.tx_hash ? "Anchored" : "Verifying_Hash"}
                    </div>
                  </div>
                  <div className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{e.category} // {e.type}</div>
                  <div className="text-[10px] font-bold text-slate-500 mt-1 italic">Collected By: {getName(e.collected_by_profile || e.collected_by)}</div>
                  <div className="mt-3 text-[10px] font-mono text-slate-400 border-t pt-3 flex justify-between">
                    <span>{formatDate(e.timestamp || e.collected_at || e.created_at)}</span>
                    <span className="text-blue-600 font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Examine →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ANALYTICAL REPORTS */}
          <div className="bg-white border border-slate-200 rounded-xl flex flex-col h-1/2 shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">Technical Forensic Reports</h2>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 p-4 custom-scrollbar">
              {(caseData.reports || []).map((r: any, i: number) => (
                <div key={i} className="border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                  <div className="flex justify-between text-[10px] font-bold mb-2">
                    <span className="text-blue-700">REF: {r.evidence_id.substring(0, 8)}</span>
                    <span className="text-slate-400 font-mono tracking-tighter">{r.submitted_at}</span>
                  </div>
                  <div className="text-[10px] font-black uppercase mb-2 text-slate-600">{r.role_from} → {r.role_to}</div>
                  <div className="p-2.5 bg-white rounded border border-slate-200 text-[11px] text-slate-800 leading-relaxed shadow-inner">
                    <strong className="block text-[9px] text-blue-600 uppercase mb-1 font-black">Findings Summary</strong>
                    {r.report?.summary}
                  </div>
                  {r.report?.notes && <div className="text-[10px] text-slate-500 italic mt-2">Notes: {r.report.notes}</div>}
                  <div className="text-[8px] font-mono text-slate-400 break-all border-t mt-3 pt-2">LINKED_TX: {r.linked_tx}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: TIMELINE & ACTIONS */}
        <div className="col-span-4 flex flex-col gap-5 overflow-hidden">

          {/* CHAIN OF CUSTODY TIMELINE */}
          <div className="bg-white border-2 border-slate-900 rounded-xl flex-1 shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-blue-400 flex justify-between items-center">
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] italic">Chain of Custody</h2>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
              <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100">
                {(caseData.timeline || []).map((t: any, i: number) => (
                  <div key={i} className="flex gap-4 relative">
                    <div className="w-4 h-4 bg-blue-600 border-4 border-white rounded-full z-10 shadow-sm mt-1"></div>
                    <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-blue-400 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-black text-blue-700 text-[10px] uppercase tracking-tighter">{t.type}</div>
                        <div className="text-[9px] font-mono text-slate-400 uppercase">{t.timestamp}</div>
                      </div>
                      <div className="text-[11px] font-bold text-slate-900 uppercase">By: {getName(t.by_profile || t.by)}</div>
                      {(t.to_profile || t.assigned_to) && (
                        <div className="text-[10px] text-blue-600 font-bold italic mt-1">TO: {getName(t.to_profile || t.assigned_to)}</div>
                      )}
                      <div className="text-[8px] font-mono text-slate-400 break-all mt-3 pt-2 border-t border-slate-200">TX: {t.tx_hash}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS & AUDIT */}
          <div className="space-y-4">
            {profile?.role === "FORENSIC_OFFICER" && (
              <div className="bg-emerald-600 text-white rounded-xl p-5 shadow-lg border-b-4 border-emerald-800">
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth="3" /></svg>
                  Anchor New Evidence
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="bg-emerald-700/40 p-2 rounded-lg border border-emerald-500 relative">
                    <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="text-center text-[10px] font-bold uppercase">{file ? file.name : "Select Forensic File"}</div>
                  </div>
                  <button onClick={handleUpload} className="w-full bg-slate-900 text-white font-black uppercase text-[10px] py-2.5 rounded-lg tracking-[0.2em] hover:bg-black transition-all active:scale-95 shadow-xl">
                    SIGN_AND_SUBMIT_HASH
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl p-4 h-32 flex flex-col shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Immutable Audit Ledger</h3>
              <div className="flex-1 overflow-y-auto text-[10px] space-y-2 pr-1 custom-scrollbar">
                {(caseData.audit || []).map((a: any, i: number) => (
                  <div key={i} className="flex gap-2 text-slate-500 border-b border-slate-50 pb-1.5">
                    <span className="font-mono text-blue-600 font-bold text-[9px] uppercase tracking-tighter">[{a.timestamp}]</span>
                    <span className="font-bold text-slate-800 italic uppercase text-[9px]">{a.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER: SYSTEM INTEGRITY */}
      <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] bg-white px-6 py-2 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-blue-500 italic lowercase tracking-normal">pramaan-core-v3.0</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Blockchain Secure</span>
        </div>
        <div className="flex gap-6">
          <span className="text-emerald-500 italic">Verified Chain of Custody</span>
          <span className="text-slate-400">© 2026 METAREALM</span>
        </div>
      </div>
    </div>
  );
}