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
        alert("Evidence uploaded");
        window.location.reload();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Upload failed");
    }
  };

  const formatDate = (val: any) => {
    if (!val) return "—";

    const d = new Date(val);
    if (isNaN(d.getTime())) return "—";

    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!caseData) return <div className="p-6">Loading...</div>;

  const getName = (val: any) =>
    typeof val === "object" ? val?.officer_name : val;

  return (
    <div className="h-full overflow-hidden flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]">
            {caseData.meta.title}
          </h1>
          <div className="text-xs text-gray-500 mt-1">
            {caseData.meta.location.place} • {caseData.meta.location.city}
          </div>
        </div>

        <div className="px-3 py-1 text-xs rounded-md bg-blue-50 text-blue-700 border border-blue-200">
          {caseData.meta.status}
        </div>
      </div>

      {/* GRID */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">

        {/* LEFT */}
        <div className="col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">

          {/* CASE */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs space-y-2">
            <div className="text-gray-500">Case Information</div>
            <div><strong>Description:</strong> {caseData.meta.description}</div>
            <div><strong>Type:</strong> {caseData.meta.case_type}</div>
            <div><strong>Priority:</strong> {caseData.meta.priority}</div>
          </div>

          {/* LOCATION */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs">
            <div className="text-gray-500 mb-1">Location</div>
            <div>{caseData.meta.location.place}</div>
            <div>{caseData.meta.location.platform}</div>
            <div>{caseData.meta.location.city}, {caseData.meta.location.state}</div>
            <div>{caseData.meta.location.country}</div>
          </div>

          {/* TIME */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs">
            <div className="text-gray-500 mb-1">Time Details</div>
            <div>Incident: {caseData.meta.incident_time}</div>
            <div>Created: {caseData.meta.created_at}</div>
          </div>

          {/* OFFICER */}
          <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 text-xs">
            <div className="text-blue-700 font-semibold mb-1">Investigating Officer</div>
            <div>{getName(caseData.officers?.investigating_officer)}</div>
          </div>

          {/* TEAM */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-xs">
            <div className="text-gray-500 mb-2">Team Members</div>

            {(caseData.members || []).map((m: any, i: number) => {
              const p = m.profile;
              return (
                <div key={i} className="mb-3 border-b pb-2">

                  <div className="font-medium">
                    {p?.officer_name || "Unknown"} ({m.role})
                  </div>

                  <div className="text-gray-500 text-[11px]">
                    {p?.rank} • {p?.department}
                  </div>

                  <div className="text-[11px]">Badge: {p?.badge_id}</div>
                  <div className="text-[11px]">Jurisdiction: {p?.jurisdiction}</div>

                  <div className="text-[10px] text-gray-400 break-all">
                    {p?.address}
                  </div>
                </div>
              );
            })}
          </div>

          {/* BLOCKCHAIN */}
          <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 text-xs">
            <div className="text-blue-700 font-semibold mb-1">Blockchain Proof</div>
            <div className="break-all">
              Tx: {caseData.chain_proof.case_creation.tx_hash}
            </div>
            <div>Block: {caseData.chain_proof.case_creation.block_height}</div>
            <div className="break-all">
              Hash: {caseData.chain_proof.case_creation.data_hash}
            </div>
          </div>

        </div>

        {/* CENTER */}
        <div className="col-span-5 flex flex-col gap-4 overflow-hidden">

          {/* EVIDENCE */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex-1 overflow-hidden">
            <h2 className="text-sm font-semibold mb-3">Evidence</h2>

            <div className="h-full overflow-y-auto space-y-2 pr-1">
              {(caseData.evidence || []).map((e: any) => (
                <div
                  key={e.evidence_id}
                  onClick={() => router.push(`/cases/${id}/evidence/${e.evidence_id}`)}
                  className="border border-[#E2E8F0] p-3 rounded-md cursor-pointer hover:bg-blue-50"
                >
                  <div className="flex justify-between">
                    <div className="font-medium text-sm">{e.evidence_id}</div>
                    <div className="text-xs text-green-600">
                      {e.tx_hash ? "Anchored" : "Pending"}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    {e.category} • {e.type}
                  </div>

                  <div className="text-xs">
                    Collected by: {getName(e.collected_by_profile || e.collected_by)}
                  </div>

                  <div className="text-[10px] text-gray-400">
                    {formatDate(e.timestamp || e.collected_at || e.created_at)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REPORTS */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex-1 overflow-hidden">
            <h2 className="text-sm font-semibold mb-3">Reports</h2>

            <div className="h-full overflow-y-auto space-y-2 pr-1">
              {(caseData.reports || []).map((r: any, i: number) => (
                <div key={i} className="border p-3 rounded-md text-xs">

                  <div className="font-medium">
                    Evidence: {r.evidence_id}
                  </div>

                  <div className="text-gray-500">
                    {r.role_from} → {r.role_to}
                  </div>

                  <div className="mt-1">
                    <strong>Summary:</strong> {r.report?.summary}
                  </div>

                  {r.report?.notes && (
                    <div className="text-gray-500">
                      {r.report.notes}
                    </div>
                  )}

                  <div className="text-[10px] text-gray-400 mt-1">
                    {r.submitted_at}
                  </div>

                  <div className="text-[10px] text-gray-400 break-all">
                    {r.linked_tx}
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="col-span-4 flex flex-col gap-4 overflow-hidden">

          {/* TIMELINE */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex-1 overflow-hidden">
            <h2 className="text-sm font-semibold mb-3">Chain of Custody</h2>

            <div className="h-full overflow-y-auto space-y-3 pr-1">
              {(caseData.timeline || []).map((t: any, i: number) => (
                <div key={i} className="flex gap-2 text-xs">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>

                  <div className="flex-1 border border-[#E2E8F0] p-2 rounded-md">
                    <div className="font-medium">{t.type}</div>

                    <div>By: {getName(t.by_profile || t.by)}</div>

                    {(t.to_profile || t.assigned_to) && (
                      <div>
                        To: {getName(t.to_profile || t.assigned_to)}
                      </div>
                    )}

                    <div className="text-gray-400">
                      {t.timestamp}
                    </div>

                    <div className="text-[10px] text-gray-400 break-all">
                      {t.tx_hash}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UPLOAD */}
          {profile?.role === "FORENSIC_OFFICER" && (
            <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">Upload Evidence</div>

              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-xs mb-2"
              />

              <button
                onClick={handleUpload}
                className="bg-blue-700 text-white px-3 py-1 rounded text-xs"
              >
                Upload
              </button>
            </div>
          )}

          {/* AUDIT */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex-1 overflow-hidden">
            <h2 className="text-sm font-semibold mb-2">Audit Logs</h2>

            <div className="h-full overflow-y-auto text-xs space-y-1 pr-1">
              {(caseData.audit || []).map((a: any, i: number) => (
                <div key={i} className="text-gray-600">
                  {a.action} • {a.timestamp}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}