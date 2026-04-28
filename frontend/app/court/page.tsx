"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CourtHome() {
  const [caseId, setCaseId] = useState("");
  const router = useRouter();

  const openCase = () => {
    if (!caseId) {
      alert("Enter Case ID");
      return;
    }

    router.push(`/court/${caseId}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Court Verification</h1>

      <input
        placeholder="Enter Case ID"
        value={caseId}
        onChange={(e) => setCaseId(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <button
        onClick={openCase}
        className="bg-blue-900 text-white px-4 py-2 rounded"
      >
        Open Case
      </button>
    </div>
  );
}