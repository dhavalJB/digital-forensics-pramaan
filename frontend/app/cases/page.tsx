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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cases</h1>

      {cases.map((c) => (
        <div
          key={c.case_id}
          onClick={() => router.push(`/cases/${c.case_id}`)}
          className="bg-white p-4 rounded shadow mb-3 cursor-pointer hover:bg-gray-50"
        >
          <div className="font-semibold">{c.meta.title}</div>
          <div className="text-sm text-gray-500">
            {c.meta.location.place}
          </div>
          <div className="text-xs mt-1">
            Status: {c.meta.status}
          </div>
        </div>
      ))}
    </div>
  );
}