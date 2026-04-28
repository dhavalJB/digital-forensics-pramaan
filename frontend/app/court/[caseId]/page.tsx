"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CourtCasePage() {
    const { caseId } = useParams();
    const router = useRouter();

    const [caseData, setCaseData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showHeavy, setShowHeavy] = useState(false);

    // =========================
    // FETCH CASE DATA
    // =========================
    useEffect(() => {
        if (!caseId) return;

        setLoading(true);

        fetch(`http://localhost:4000/court/full-case/${caseId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setCaseData(data.case);
                } else {
                    setCaseData(null);
                }
            })
            .catch(() => setCaseData(null))
            .finally(() => setLoading(false));
    }, [caseId]);

    // =========================
    // LOAD HEAVY DATA AFTER UI PAINT
    // =========================
    useEffect(() => {
        if (caseData) {
            setTimeout(() => setShowHeavy(true), 100);
        }
    }, [caseData]);

    // =========================
    // STATES
    // =========================
    if (loading) return <div className="p-6">Loading case...</div>;
    if (!caseData) return <div className="p-6">Case not found</div>;

    return (
        <div className="p-6 space-y-6">

            {/* ============================= */}
            {/* HEADER */}
            {/* ============================= */}
            <h1 className="text-2xl font-bold">
                {caseData.meta?.title || "Untitled Case"}
            </h1>

            {/* ============================= */}
            {/* OFFICERS */}
            {/* ============================= */}
            <div className="bg-blue-50 p-4 rounded">
                <div className="text-sm text-gray-600">Investigating Officer</div>

                <div className="font-semibold">
                    {caseData.officers?.investigating_officer?.name}
                </div>

                <div className="text-xs text-gray-500">
                    {caseData.officers?.investigating_officer?.rank} •{" "}
                    {caseData.officers?.investigating_officer?.department}
                </div>
            </div>

            {/* ============================= */}
            {/* CASE INFO */}
            {/* ============================= */}
            <div className="bg-white p-5 rounded shadow">
                <h2 className="font-semibold mb-2">Case Information</h2>

                <div><strong>Description:</strong> {caseData.meta?.description}</div>
                <div><strong>Type:</strong> {caseData.meta?.case_type}</div>
                <div><strong>Status:</strong> {caseData.meta?.status}</div>
                <div><strong>Priority:</strong> {caseData.meta?.priority}</div>
            </div>

            {/* ============================= */}
            {/* LOCATION */}
            {/* ============================= */}
            <div className="bg-white p-5 rounded shadow">
                <h2 className="font-semibold mb-2">Location</h2>

                <div>{caseData.meta?.location?.place}</div>
                <div>
                    {caseData.meta?.location?.city}, {caseData.meta?.location?.state}
                </div>
            </div>

            {/* ============================= */}
            {/* TEAM */}
            {/* ============================= */}
            <div className="bg-white p-5 rounded shadow">
                <h2 className="font-semibold mb-2">Team Members</h2>

                {(caseData.members || []).map((m: any, i: number) => (
                    <div key={i}>
                        {m.profile?.name} ({m.role})
                    </div>
                ))}
            </div>

            {/* ============================= */}
            {/* HEAVY DATA (LAZY LOAD) */}
            {/* ============================= */}
            {!showHeavy ? (
                <div className="text-gray-500">Loading details...</div>
            ) : (
                <>
                    {/* ============================= */}
                    {/* TIMELINE */}
                    {/* ============================= */}
                    <div className="bg-white p-5 rounded shadow">
                        <h2 className="font-semibold mb-3">Chain of Custody</h2>

                        {(caseData.timeline || []).map((t: any, i: number) => (
                            <div key={i} className="border p-3 rounded mb-2">
                                <div className="font-semibold">{t.type}</div>

                                {t.by_profile && (
                                    <div>
                                        By: {t.by_profile.name} ({t.by_profile.role})
                                    </div>
                                )}

                                {t.from_profile && (
                                    <div>From: {t.from_profile.name}</div>
                                )}

                                {t.to_profile && (
                                    <div>To: {t.to_profile.name}</div>
                                )}

                                <div className="text-xs text-gray-500">
                                    {t.timestamp}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ============================= */}
                    {/* EVIDENCE */}
                    {/* ============================= */}
                    <div className="bg-white p-5 rounded shadow">
                        <h2 className="font-semibold mb-3">Evidence</h2>

                        {(caseData.evidence || []).map((e: any) => (
                            <div
                                key={e.evidence_id}
                                onClick={() =>
                                    router.push(`/court/${caseId}/${e.evidence_id}`)
                                }
                                className="border p-3 rounded mb-2 cursor-pointer hover:bg-gray-50"
                            >
                                <div className="font-semibold">{e.evidence_id}</div>

                                <div className="text-sm">
                                    {e.category} • {e.type}
                                </div>

                                <div className="text-xs">
                                    Collected by: {e.collected_by_profile?.name}
                                </div>

                                <div className="text-xs text-gray-500">
                                    Owner: {e.ownership?.current_owner_profile?.name}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ============================= */}
                    {/* REPORTS */}
                    {/* ============================= */}
                    <div className="bg-white p-5 rounded shadow">
                        <h2 className="font-semibold mb-3">Reports</h2>

                        {(caseData.reports || []).map((r: any, i: number) => (
                            <div key={i} className="border p-3 rounded mb-2">
                                <div className="font-semibold">
                                    {r.from_profile?.name} → {r.to_profile?.name}
                                </div>

                                <div className="text-sm mt-2">
                                    {r.report?.summary}
                                </div>

                                <div className="text-xs text-gray-500">
                                    {r.submitted_at}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}