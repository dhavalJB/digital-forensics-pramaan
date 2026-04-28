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
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* HEADER */}
      <div>
        <h1 className="text-xl font-semibold text-[#0F172A]">Cases</h1>
        <p className="text-xs text-gray-500">
          Manage and review all assigned cases
        </p>
      </div>

      {/* LIST CONTAINER */}
      <div className="flex-1 overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">

        <div className="h-full overflow-y-auto pr-1 space-y-3">

          {cases.length === 0 && (
            <div className="text-sm text-gray-400">
              No cases available
            </div>
          )}

          {cases.map((c) => {
            const status = c.meta.status;

            let statusColor =
              "bg-gray-100 text-gray-600 border-gray-200";

            if (status === "OPEN")
              statusColor = "bg-blue-50 text-blue-700 border-blue-200";
            else if (status === "INVESTIGATING")
              statusColor = "bg-yellow-50 text-yellow-700 border-yellow-200";
            else if (status === "CLOSED")
              statusColor = "bg-green-50 text-green-700 border-green-200";

            return (
              <div
                key={c.case_id}
                onClick={() => router.push(`/cases/${c.case_id}`)}
                className="bg-white border border-[#E2E8F0] rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="flex justify-between items-start">

                  <div>
                    <div className="font-semibold text-[#0F172A]">
                      {c.meta.title}
                    </div>

                    <div className="text-sm text-gray-500 mt-1">
                      {c.meta.location.place}
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      Case ID: {c.case_id}
                    </div>
                  </div>

                  <div
                    className={`text-xs px-2 py-1 rounded-md border ${statusColor}`}
                  >
                    {status}
                  </div>
                </div>

                <div className="mt-3 flex justify-between text-xs text-gray-500">
                  <span>Evidence: {c.evidence.length}</span>
                  <span className="text-blue-600">Open →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}