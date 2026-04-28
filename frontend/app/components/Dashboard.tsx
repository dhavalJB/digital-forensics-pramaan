"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../context/SessionContext";

export default function Dashboard() {
  const { session } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);

  useEffect(() => {
    if (!session?.address) return;

    fetch(`http://localhost:4000/profile/${session.address}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile))
      .catch(() => setProfile(null));

    fetch(`http://localhost:4000/cases/${session.address}`)
      .then((res) => res.json())
      .then((data) => setCases(data.cases || []))
      .catch(() => setCases([]));

    fetch("http://localhost:4000/evidence/incoming", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: session.address }),
    })
      .then((res) => res.json())
      .then((data) => setIncoming(data.success ? data.transfers || [] : []))
      .catch(() => setIncoming([]));
  }, [session]);

  if (!session) return null;

  const totalCases = cases.length;
  const pendingEvidence = cases.filter((c) => c.evidence.length === 0).length;

  return (
    <div className="h-full overflow-hidden flex flex-col gap-4">

      {/* HEADER */}
      <div className="flex justify-between items-center bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 shadow-sm">
        <div>
          <h1 className="text-lg font-semibold text-[#0F172A]">Dashboard</h1>
          <p className="text-xs text-gray-500">
            Overview of system activity
          </p>
        </div>

        <div className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-md">
          ● System Active
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">

        {/* LEFT PANEL */}
        <div className="col-span-3 flex flex-col gap-4">

          {/* PROFILE */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1">Officer</div>
            <div className="font-semibold text-sm text-[#0F172A]">
              {profile?.officer_name}
            </div>
            <div className="text-[11px] text-blue-600 font-medium">
              {profile?.role}
            </div>

            <div className="mt-3 text-[10px] font-mono text-gray-500 break-all">
              {session.address}
            </div>
          </div>

          {/* ALERT + INCOMING */}
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-4 flex flex-col gap-3 overflow-hidden">

            <div>
              <div className="text-xs font-semibold text-[#9A3412]">Alerts</div>
              <div className="text-xs text-[#9A3412] mt-1">
                {pendingEvidence === 0
                  ? "All cases updated"
                  : `${pendingEvidence} pending evidence`}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {incoming.length === 0 ? (
                <div className="text-xs text-gray-400">
                  No incoming transfers
                </div>
              ) : (
                incoming.map((t, i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#E2E8F0] p-3 rounded-lg hover:bg-blue-50 transition"
                  >
                    <div className="text-xs font-medium text-[#0F172A]">
                      {t.evidence_id}
                    </div>

                    <div className="text-[11px] text-gray-500">
                      Case: {t.case_id}
                    </div>

                    <button
                      onClick={() =>
                        router.push(
                          `/cases/${t.case_id}/evidence/${t.evidence_id}`
                        )
                      }
                      className="mt-1 text-blue-600 text-[11px]"
                    >
                      View →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-9 flex flex-col gap-4">

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total Cases</div>
              <div className="text-xl font-semibold text-blue-700">
                {totalCases}
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500">Pending</div>
              <div className="text-xl font-semibold text-red-600">
                {pendingEvidence}
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
              <div className="text-xs text-gray-500">Completed</div>
              <div className="text-xl font-semibold text-green-600">
                {totalCases - pendingEvidence}
              </div>
            </div>
          </div>

          {/* CASES */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 flex-1 overflow-hidden shadow-sm">

            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-[#0F172A]">
                Active Cases
              </h2>
              <button
                onClick={() => router.push("/cases")}
                className="text-blue-600 text-xs"
              >
                View All →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 overflow-y-auto h-full pr-1">
              {cases.slice(0, 9).map((c) => (
                <div
                  key={c.case_id}
                  onClick={() => router.push(`/cases/${c.case_id}`)}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3 cursor-pointer hover:border-blue-400 hover:bg-white hover:shadow-sm transition"
                >
                  <div className="text-sm font-medium text-[#0F172A] line-clamp-2">
                    {c.meta.title}
                  </div>

                  <div className="text-[11px] text-gray-500 mt-1">
                    {c.meta.location.place}
                  </div>

                  <div className="mt-2 flex justify-between text-[11px]">
                    <span className="text-gray-400">
                      {c.evidence.length} evd
                    </span>
                    <span className="text-blue-600">Open</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}