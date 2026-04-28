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
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  if (!caseData) return <div>Loading...</div>;

  // 🔥 SAFE HELPERS
  const getName = (val: any) =>
    typeof val === "object" ? val?.officer_name : val;

  return (
    <div className="p-6 space-y-4">

      {/* HEADER */}
      <h1 className="text-2xl font-bold">
        {caseData?.meta?.title}
      </h1>

      {/* CASE INFO */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Case Information</h2>

        <div><strong>Description:</strong> {caseData?.meta?.description}</div>
        <div><strong>Type:</strong> {caseData?.meta?.case_type}</div>
        <div><strong>Priority:</strong> {caseData?.meta?.priority}</div>
        <div><strong>Status:</strong> {caseData?.meta?.status}</div>
      </div>

      {/* LOCATION */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Location</h2>

        <div>{caseData?.meta?.location?.place}</div>
        <div>{caseData?.meta?.location?.platform}</div>
        <div>
          {caseData?.meta?.location?.city}, {caseData?.meta?.location?.state}
        </div>
        <div>{caseData?.meta?.location?.country}</div>
      </div>

      {/* TIME */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Time Details</h2>

        <div><strong>Incident:</strong> {caseData?.meta?.incident_time}</div>
        <div><strong>Created:</strong> {caseData?.meta?.created_at}</div>
      </div>

      {/* OFFICERS */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Officers</h2>

        <div>
          <strong>Investigating Officer:</strong>{" "}
          {getName(caseData?.officers?.investigating_officer)}
        </div>

      </div>

      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Team Members</h2>

        {(caseData.members || []).length === 0 ? (
          <div className="text-sm text-gray-500">No members assigned</div>
        ) : (
          caseData.members.map((m: any, i: number) => {
            const p = m.profile;

            return (
              <div key={i} className="border-b py-3">

                {/* NAME + ROLE */}
                <div className="font-semibold">
                  {p?.officer_name || "Unknown"}
                  <span className="text-sm text-gray-500"> ({m.role})</span>
                </div>

                {/* RANK + DEPARTMENT */}
                <div className="text-sm text-gray-600">
                  {p?.rank} • {p?.department}
                </div>

                {/* BADGE */}
                <div className="text-xs">
                  Badge ID: {p?.badge_id}
                </div>

                {/* JURISDICTION */}
                <div className="text-xs">
                  Jurisdiction: {p?.jurisdiction}
                </div>



                {/* WALLET */}
                <div className="text-xs text-gray-400">
                  Wallet: {p?.address}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* BLOCKCHAIN */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Blockchain Proof</h2>

        <div><strong>Tx Hash:</strong> {caseData?.chain_proof?.case_creation?.tx_hash}</div>
        <div><strong>Block:</strong> {caseData?.chain_proof?.case_creation?.block_height}</div>
        <div><strong>Data Hash:</strong> {caseData?.chain_proof?.case_creation?.data_hash}</div>
      </div>

      {/* TIMELINE */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Chain of Custody</h2>

        {(caseData?.timeline || []).length === 0 ? (
          <div className="text-sm text-gray-500">No custody events</div>
        ) : (
          caseData.timeline.map((t: any, i: number) => (
            <div key={i} className="text-sm border-b py-2">
              <div><strong>{t.type}</strong></div>

              <div>
                By: {getName(t.by_profile || t.by)}
              </div>

              {(t.to_profile || t.assigned_to) && (
                <div>
                  Assigned To: {getName(t.to_profile || t.assigned_to)}
                </div>
              )}

              <div>Time: {t.timestamp}</div>
              <div className="text-xs text-gray-500">
                Tx: {t.tx_hash}
              </div>
            </div>
          ))
        )}
      </div>

      {/* UPLOAD */}
      {profile?.role === "FORENSIC_OFFICER" && (
        <div className="bg-white p-5 rounded shadow">
          <h2 className="font-semibold mb-3">Upload Evidence</h2>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-3"
          />

          <button
            onClick={handleUpload}
            className="bg-blue-900 text-white px-4 py-2 rounded"
          >
            Upload Evidence
          </button>
        </div>
      )}

      {/* EVIDENCE */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-3">Evidence</h2>

        {(caseData?.evidence || []).length === 0 ? (
          <div className="text-sm text-gray-500">
            No evidence added yet
          </div>
        ) : (
          <div className="space-y-3">
            {caseData.evidence.map((e: any) => (
              <div
                key={e.evidence_id}
                onClick={() =>
                  router.push(`/cases/${id}/evidence/${e.evidence_id}`)
                }
                className="border p-3 rounded cursor-pointer hover:bg-gray-50"
              >
                <div className="flex justify-between">
                  <div className="font-semibold">{e.evidence_id}</div>
                  <div className="text-xs text-green-600">
                    {e.tx_hash ? "Anchored" : "Pending"}
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  {e.category} • {e.type}
                </div>

                <div className="text-xs">
                  Collected by: {getName(e.collected_by_profile || e.collected_by)}
                </div>

                <div className="text-xs">
                  {new Date(e.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REPORTS */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-3">Reports</h2>

        {(caseData?.reports || []).length === 0 ? (
          <div className="text-sm text-gray-500">
            No reports submitted
          </div>
        ) : (
          caseData.reports.map((r: any, i: number) => (
            <div key={i} className="border p-3 rounded mb-3">

              <div className="font-semibold">
                Evidence: {r.evidence_id}
              </div>

              <div className="text-xs text-gray-500">
                {r.role_from} → {r.role_to}
              </div>

              <div className="mt-2 text-sm">
                <strong>Summary:</strong> {r.report?.summary}
              </div>

              {r.report?.notes && (
                <div className="text-sm">
                  <strong>Notes:</strong> {r.report.notes}
                </div>
              )}

              <div className="text-xs text-gray-500 mt-2">
                Submitted: {r.submitted_at}
              </div>

              <div className="text-xs text-gray-400">
                Tx: {r.linked_tx}
              </div>

            </div>
          ))
        )}
      </div>

      {/* AUDIT */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Audit Logs</h2>

        {(caseData?.audit || []).map((a: any, i: number) => (
          <div key={i} className="text-sm">
            {a.action} - {a.timestamp}
          </div>
        ))}
      </div>

    </div>
  );
}