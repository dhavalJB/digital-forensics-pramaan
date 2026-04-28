"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";

export default function EvidenceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const eid = params.eid as string;

  const { session } = useSession();

  const [profile, setProfile] = useState<any>(null);
  const [evidence, setEvidence] = useState<any>(null);
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");

  const role = profile?.role;

  // 🔥 HELPERS
  const getAddress = (val: any) =>
    typeof val === "object" ? val?.address : val;

  const getName = (val: any) =>
    typeof val === "object" ? val?.officer_name : val;

  useEffect(() => {
    if (!id || !eid || !session?.address) return;

    fetch(`http://localhost:4000/case/${id}/evidence/${eid}`)
      .then((res) => res.json())
      .then((data) => setEvidence(data.evidence))
      .catch(console.error);

    fetch(`http://localhost:4000/profile/${session.address}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile))
      .catch(console.error);
  }, [id, eid, session]);

  // =========================
  // 🔁 TRANSFER
  // =========================
  const handleTransfer = async () => {
    if (!to) return alert("Enter receiver address");

    if (role === "ANALYST" && !summary) {
      return alert("Summary is required for Analyst transfer");
    }

    try {
      const res = await fetch("http://localhost:4000/evidence/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          case_id: id,
          evidence_id: eid,
          from: session.address,
          to,
          keyName: session.name,
          report:
            role === "ANALYST"
              ? {
                  summary,
                  notes,
                }
              : undefined,
        })
      });

      const data = await res.json();

      if (data.success) {
        alert("Transfer successful");
        window.location.reload();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Transfer failed");
    }
  };

  // =========================
  // ✅ ACCEPT
  // =========================
  const handleAccept = async () => {
    try {
      const res = await fetch("http://localhost:4000/evidence/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: id,
          evidence_id: eid,
          by: session.address,
          keyName: session.name,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Evidence accepted");
        window.location.reload();
      } else {
        alert(data.error || "Failed to accept");
      }
    } catch (err) {
      console.error(err);
      alert("Error accepting evidence");
    }
  };

  if (!evidence) return <div className="p-6">Loading...</div>;

  // 🔥 FIXED OWNERSHIP LOGIC
  const currentOwner = getAddress(evidence?.ownership?.current_owner);
  const pendingOwner = getAddress(evidence?.ownership?.pending_owner);

  const isOwner = currentOwner === session?.address;
  const isPending = !!pendingOwner;
  const isIncoming = pendingOwner === session?.address;
  const isOutgoing = pendingOwner && currentOwner === session?.address;

  const fileUrl = `http://localhost:4000/files/${id}/files/${evidence.file_name}`;

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Evidence Details</h1>

      {/* MAIN */}
      <div className="bg-white p-6 rounded-xl shadow grid grid-cols-2 gap-6">

        {/* PREVIEW */}
        <div className="w-full h-[350px] bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">

          {evidence.category === "IMAGE" && (
            <img src={fileUrl} className="max-h-full max-w-full object-contain" />
          )}

          {evidence.category === "VIDEO" && (
            <video controls className="max-h-full max-w-full object-contain">
              <source src={fileUrl} />
            </video>
          )}

          {evidence.category === "AUDIO" && (
            <audio controls className="w-full px-4">
              <source src={fileUrl} />
            </audio>
          )}

          {evidence.category === "DOCUMENT" && (
            <a href={fileUrl} target="_blank" className="text-blue-600 underline">
              Open Document
            </a>
          )}

        </div>

        {/* DETAILS */}
        <div className="text-sm space-y-2">
          <div><strong>Evidence ID:</strong> {evidence.evidence_id}</div>
          <div><strong>Case ID:</strong> {evidence.case_id}</div>
          <div><strong>File Name:</strong> {evidence.file_name}</div>
          <div><strong>File Type:</strong> {evidence.category}</div>
          <div><strong>File Size:</strong> {(evidence.size / 1024).toFixed(2)} KB</div>

          <div>
            <strong>Uploaded By:</strong>{" "}
            {getName(evidence.collected_by_profile || evidence.collected_by)}
          </div>

          <div><strong>Upload Time:</strong> {new Date(evidence.collected_at).toLocaleString()}</div>

          <div>
            <strong>Current Owner:</strong>{" "}
            {getName(evidence?.ownership?.current_owner)}
          </div>

          <div>
            <strong>Location:</strong>{" "}
            {evidence.location?.lat}, {evidence.location?.lng}
          </div>
        </div>
      </div>

      {/* INTEGRITY */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold text-lg">Integrity Information</h2>

        <div>
          <strong>SHA-256 Hash</strong>
          <div className="bg-gray-100 p-2 rounded text-xs break-all mt-1">
            {evidence.hash}
          </div>
        </div>

        <div>
          <strong>Status:</strong>{" "}
          {evidence.chain_proof ? (
            <span className="text-green-600 font-semibold">
              Anchored on PRAMAAN Blockchain
            </span>
          ) : (
            <span className="text-yellow-600">
              Not Anchored
            </span>
          )}
        </div>

        {evidence.chain_proof && (
          <>
            <div><strong>Block Height:</strong> {evidence.chain_proof.block_height}</div>

            <div>
              <strong>Transaction Hash:</strong>
              <div className="bg-gray-100 p-2 rounded text-xs break-all mt-1">
                {evidence.chain_proof.tx_hash}
              </div>
            </div>

            <div>
              <strong>Timestamp:</strong>{" "}
              {new Date(evidence.chain_proof.timestamp).toLocaleString()}
            </div>

            {/* TRANSFER */}
            {isOwner && !isPending && (
              <div className="bg-white p-6 rounded-xl shadow space-y-3">
                <h2 className="font-semibold">Transfer Evidence</h2>

                <input
                  placeholder="Receiver address"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="border p-2 rounded w-full"
                />

                {role === "ANALYST" && (
                  <>
                    <input
                      placeholder="Summary (required)"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className="border p-2 rounded w-full"
                    />

                    <textarea
                      placeholder="Detailed notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="border p-2 rounded w-full"
                    />
                  </>
                )}

                <button
                  onClick={handleTransfer}
                  className="bg-blue-900 text-white px-4 py-2 rounded"
                >
                  Transfer
                </button>
              </div>
            )}

            {/* ACCEPT */}
            {isIncoming && (
              <div className="bg-yellow-100 p-4 rounded">
                <strong>Incoming Evidence</strong>
                <div className="text-sm mt-2">
                  Accept to take custody
                </div>

                <button
                  onClick={handleAccept}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
                >
                  Accept Evidence
                </button>
              </div>
            )}

            {/* PENDING */}
            {isOutgoing && (
              <div className="bg-gray-100 p-4 rounded">
                <strong>Transfer Pending</strong>
                <div className="text-sm mt-2">
                  Waiting for receiver
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}