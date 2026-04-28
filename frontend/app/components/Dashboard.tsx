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

    // PROFILE
    fetch(`http://localhost:4000/profile/${session.address}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile))
      .catch(() => setProfile(null));

    // CASES
    fetch(`http://localhost:4000/cases/${session.address}`)
      .then((res) => res.json())
      .then((data) => setCases(data.cases || []))
      .catch(() => setCases([]));

    // 🔥 INCOMING TRANSFERS
    fetch("http://localhost:4000/evidence/incoming", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: session.address,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIncoming(data.transfers || []);
        } else {
          setIncoming([]);
        }
      })
      .catch(() => setIncoming([]));

  }, [session]);

  if (!session) return null;

  const totalCases = cases.length;
  const pendingEvidence = cases.filter(c => c.evidence.length === 0).length;

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* PROFILE */}
      <div className="bg-white p-5 rounded shadow mb-6">
        <div><strong>Officer:</strong> {profile?.officer_name}</div>
        <div><strong>Role:</strong> {profile?.role}</div>
        <div><strong>Address:</strong> {session.address}</div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Total Cases</div>
          <div className="text-xl font-bold">{totalCases}</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Pending Evidence</div>
          <div className="text-xl font-bold text-red-500">
            {pendingEvidence}
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-xl font-bold">
            {totalCases - pendingEvidence}
          </div>
        </div>

      </div>

      {/* ALERTS */}
      <div className="bg-yellow-100 p-4 rounded mb-6">
        <strong>Alerts:</strong>
        {pendingEvidence === 0 ? (
          <div className="text-sm mt-1">All cases updated</div>
        ) : (
          <div className="text-sm mt-1">
            {pendingEvidence} cases missing evidence upload
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">Incoming Evidence</h2>

        {incoming.length === 0 ? (
          <div className="text-sm text-gray-500">
            No incoming transfers
          </div>
        ) : (
          incoming.map((t, i) => (
            <div key={i} className="border p-3 rounded mb-2">
              <div><strong>Case:</strong> {t.case_id}</div>
              <div><strong>Evidence:</strong> {t.evidence_id}</div>
              <div className="text-xs text-gray-500">
                From: {t.from}
              </div>

              <button
                onClick={() =>
                  router.push(`/cases/${t.case_id}/evidence/${t.evidence_id}`)
                }
                className="mt-2 text-blue-600 text-sm"
              >
                View →
              </button>
            </div>
          ))
        )}
      </div>

      {/* RECENT CASES */}
      <div className="bg-white p-5 rounded shadow">
        <h2 className="font-semibold mb-3">Recent Cases</h2>

        {cases.slice(0, 3).map((c) => (
          <div
            key={c.case_id}
            onClick={() => router.push(`/cases/${c.case_id}`)}
            className="border p-3 rounded mb-2 cursor-pointer hover:bg-gray-50"
          >
            <div className="font-medium">{c.meta.title}</div>
            <div className="text-sm text-gray-500">
              {c.meta.location.place}
            </div>
          </div>
        ))}

        <button
          onClick={() => router.push("/cases")}
          className="mt-3 text-blue-600 text-sm"
        >
          View All Cases →
        </button>
      </div>

    </div>
  );
}