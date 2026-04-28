"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "../../../context/SessionContext";

export default function EvidenceDetailPage() {
  const params = useParams();
  const { session } = useSession();

  const id = params.id as string;
  const eid = params.eid as string;

  const [evidence, setEvidence] = useState<any>(null);
  const [to, setTo] = useState("");

  // ✅ FETCH SINGLE EVIDENCE (CORRECT API)
  useEffect(() => {
    if (!id || !eid) return;

    fetch(`http://localhost:4000/case/${id}/evidence/${eid}`)
      .then((res) => res.json())
      .then((data) => setEvidence(data.evidence))
      .catch(console.error);
  }, [id, eid]);

  if (!evidence) return <div className="p-6">Loading...</div>;

  // 🔥 FILE URL (FIXED PATH)
  const fileUrl = `http://localhost:4000/files/${id}/${evidence.file_name}`;

  // 🔐 ONLY OWNER CAN TRANSFER
  const isOwner =
    session?.address === evidence.ownership?.current_owner;

  // 🚀 TRANSFER HANDLER
  const handleTransfer = async () => {
    if (!to) return alert("Enter receiver address");

    try {
      const res = await fetch("http://localhost:4000/evidence/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          case_id: id,
          evidence_id: eid,
          from: session.address,
          to,
          keyName: session.keyName,
        }),
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
    }
  };

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <h1 className="text-xl font-bold">
        Evidence: {evidence.evidence_id}
      </h1>

      {/* FILE PREVIEW */}
      <div className="bg-white p-5 rounded shadow flex justify-center">
        <div className="w-[500px] h-[350px] flex items-center justify-center bg-gray-100 rounded overflow-hidden">

          {evidence.category === "IMAGE" && (
            <img src={fileUrl} className="max-h-full object-contain" />
          )}

          {evidence.category === "VIDEO" && (
            <video controls className="max-h-full">
              <source src={fileUrl} />
            </video>
          )}

          {evidence.category === "AUDIO" && (
            <audio controls className="w-full">
              <source src={fileUrl} />
            </audio>
          )}

          {evidence.category === "DOCUMENT" && (
            <a href={fileUrl} target="_blank" className="text-blue-600 underline">
              Open Document
            </a>
          )}
        </div>
      </div>

      {/* DETAILS */}
      <div className="bg-white p-5 rounded shadow text-sm space-y-2">
        <div><strong>Type:</strong> {evidence.type}</div>
        <div><strong>Category:</strong> {evidence.category}</div>
        <div><strong>Size:</strong> {(evidence.size / 1024).toFixed(2)} KB</div>

        <div><strong>Collected By:</strong> {evidence.collected_by}</div>
        <div><strong>Time:</strong> {evidence.collected_at}</div>

        <div>
          <strong>Location:</strong>{" "}
          {evidence.location?.lat}, {evidence.location?.lng}
        </div>

        <div>
          <strong>Current Owner:</strong>{" "}
          {evidence.ownership?.current_owner}
        </div>
      </div>

      {/* HASH */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Integrity</h2>
        <div className="break-all text-sm">{evidence.hash}</div>
      </div>

      {/* BLOCKCHAIN */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Blockchain Proof</h2>

        {evidence.chain_proof ? (
          <>
            <div className="text-sm break-all">
              TX: {evidence.chain_proof.tx_hash}
            </div>
            <div className="text-sm">
              Block: {evidence.chain_proof.block_height}
            </div>
            <div className="text-green-600 text-sm mt-2">
              Anchored on PRAMAAN
            </div>
          </>
        ) : (
          <div className="text-yellow-600 text-sm">
            Not yet anchored
          </div>
        )}
      </div>

      {/* CHAIN OF CUSTODY */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Chain of Custody</h2>

        {evidence.ownership.history.map((h: any, i: number) => (
          <div key={i} className="text-sm border-b py-2">
            <div>Owner: {h.owner}</div>
            <div>Action: {h.action}</div>
            <div>Time: {h.timestamp}</div>
          </div>
        ))}
      </div>

      {/* 🔥 TRANSFER SECTION */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-2">Transfer Evidence</h2>

        {isOwner ? (
          <>
            <input
              type="text"
              placeholder="Enter receiver address"
              className="border p-2 w-full mb-3"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />

            <button
              onClick={handleTransfer}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Transfer
            </button>
          </>
        ) : (
          <div className="text-sm text-gray-500">
            You are not the current owner
          </div>
        )}
      </div>

    </div>
  );
}