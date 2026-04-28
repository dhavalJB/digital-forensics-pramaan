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
    if (!file) {
      alert("Please upload a file");
      return;
    }

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
      console.error(err);
      alert("Verification failed");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <h1 className="text-2xl font-bold">Court Evidence Verification</h1>

      {/* UPLOAD */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="font-semibold">Upload Evidence File</h2>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleVerify}
          disabled={loading}
          className="bg-blue-900 text-white px-4 py-2 rounded"
        >
          {loading ? "Verifying..." : "Verify Evidence"}
        </button>
      </div>

      {/* RESULT */}
      {result?.success && (
        <div className="bg-white p-6 rounded-xl shadow space-y-6">

          {/* 🔥 VERDICT */}
          <div
            className={`p-5 rounded text-white text-lg font-bold ${result.verification.match
              ? "bg-green-600"
              : "bg-red-600"
              }`}
          >
            {result.verification.match
              ? "✔ VERIFIED — Evidence matches original"
              : "❌ TAMPERED — Integrity compromised"}
          </div>

          {/* 🔥 EVIDENCE PREVIEW */}
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="font-semibold mb-3">Evidence Preview</h2>

            {(() => {
              const fileUrl = `http://localhost:4000/files/${caseId}/files/${result.evidence.file_name}`;

              return (
                <div className="w-full h-[350px] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">

                  {/* IMAGE */}
                  {result.evidence.category === "IMAGE" && (
                    <img
                      src={fileUrl}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}

                  {/* VIDEO */}
                  {result.evidence.category === "VIDEO" && (
                    <video controls className="max-h-full max-w-full object-contain">
                      <source src={fileUrl} />
                    </video>
                  )}

                  {/* AUDIO */}
                  {result.evidence.category === "AUDIO" && (
                    <audio controls className="w-full px-4">
                      <source src={fileUrl} />
                    </audio>
                  )}

                  {/* DOCUMENT */}
                  {result.evidence.category === "DOCUMENT" && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      Open Document
                    </a>
                  )}

                </div>
              );
            })()}
          </div>

          {/* EVIDENCE */}
          <div>
            <h2 className="font-semibold mb-2">Evidence Details</h2>

            <div><strong>ID:</strong> {result.evidence.evidence_id}</div>
            <div><strong>Type:</strong> {result.evidence.type}</div>

            <div>
              <strong>Collected By:</strong>{" "}
              {result.evidence.collected_by?.name} (
              {result.evidence.collected_by?.role})
            </div>

            <div>
              <strong>Current Owner:</strong>{" "}
              {result.evidence.current_owner?.name} (
              {result.evidence.current_owner?.role})
            </div>

            <div><strong>Collected At:</strong> {result.evidence.collected_at}</div>
          </div>

          {/* CHAIN OF CUSTODY */}
          <div>
            <h2 className="font-semibold mb-2">Chain of Custody</h2>

            {result.chain_of_custody.map((c: any, i: number) => (
              <div key={i} className="border p-3 rounded mb-2">

                <div className="font-semibold">{c.event}</div>

                {c.from && (
                  <div>
                    From: {c.from.name} ({c.from.role})
                  </div>
                )}

                {c.to && (
                  <div>
                    To: {c.to.name} ({c.to.role})
                  </div>
                )}

                {c.by && (
                  <div>
                    By: {c.by.name} ({c.by.role})
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {c.time}
                </div>
              </div>
            ))}
          </div>

          {/* REPORTS */}
          <div>
            <h2 className="font-semibold mb-2">Reports</h2>

            {result.reports.length === 0 ? (
              <div className="text-sm text-gray-500">
                No reports available
              </div>
            ) : (
              result.reports.map((r: any, i: number) => (
                <div key={i} className="border p-3 rounded mb-2">

                  <div className="font-semibold">
                    {r.from?.name} → {r.to?.name}
                  </div>

                  <div className="text-sm mt-2">
                    {r.summary}
                  </div>

                  <div className="text-xs text-gray-500">
                    {r.submitted_at}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* AUDIT */}
          <div>
            <h2 className="font-semibold mb-2">Audit Trail</h2>

            {result.audit?.map((a: any, i: number) => (
              <div key={i} className="border p-2 rounded mb-2">

                <div>{a.action}</div>

                {a.by && (
                  <div className="text-sm">
                    By: {a.by.name} ({a.by.role})
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  {a.timestamp}
                </div>
              </div>
            ))}
          </div>

          {/* FINAL STATEMENT */}
          <div className="bg-gray-100 p-4 rounded font-medium">
            {result.statement}
          </div>

        </div>
      )}
    </div>
  );
}