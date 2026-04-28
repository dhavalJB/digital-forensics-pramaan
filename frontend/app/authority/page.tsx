"use client";

import { useEffect, useState, useMemo } from "react";

export default function MoEPortal() {
    const [proposals, setProposals] = useState<any[]>([]);
    const [activeAuth, setActiveAuth] = useState<"MOE" | "UGC" | "NAAC">("MOE");
    const [loading, setLoading] = useState(false);
    const [authorityInfo, setAuthorityInfo] = useState<any>(null);
    const [verifying, setVerifying] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACTIVE">("ALL");

    const authorities = {
        MOE: {
            address: "pramaan15ey2xpyxddkec22p3uf02lvyrzgyadv6mk8du3",
            keyName: "auth_f57a0788",
            label: "National Forensic Authority",
            short: "NFA",
            accent: "#B45309",
        },
        UGC: {
            address: "pramaan18wnphcznar5mswy4kr9hvdgh4wru2zt5pmwx00",
            keyName: "auth_9df50fb2",
            label: "Digital Crime Unit",
            short: "dcu",
            accent: "#1D4ED8",
        },
        NAAC: {
            address: "pramaan1khvh0tuec3kk52ezshcecjm0shvhff0g4536wx",
            keyName: "auth_cd1c2ced",
            label: "Evidence Control Department",
            short: "ecd",
            accent: "#065F46",
        }
    };

    const verifyAuthority = async () => {
        setVerifying(true);
        try {
            const addr = authorities[activeAuth].address;
            const res = await fetch(`http://localhost:4000/authority/details?address=${addr}`);
            const data = await res.json();
            if (data.success) setAuthorityInfo(data.identity);
        } catch (e) { console.error("Authority verification failed", e); }
        setVerifying(false);
    };

    const fetchProposals = async () => {
        try {
            const pRes = await fetch("http://localhost:4000/proposals");
            const pData = await pRes.json();
            const rawProposals = pData.proposals || [];

            const vRes = await fetch("http://localhost:4000/validators");
            const vData = await vRes.json();
            const liveValidators = vData.validators || [];

            const enriched = rawProposals.map((prop: any) => {
                const liveMatch = liveValidators.find((v: any) => v.address.trim() === prop.applicant.trim());
                return {
                    ...prop,
                    address: prop.applicant,
                    isLive: liveMatch?.isLive || prop.status === "ACTIVATED",
                };
            });
            setProposals(enriched);
        } catch (e) { console.error("Fetch error:", e); }
    };

    const approveProposal = async (proposalId: string) => {
        setLoading(true);
        const keyName = authorities[activeAuth].keyName;
        try {
            const res = await fetch("http://localhost:4000/authority/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: keyName, proposalId }),
            });
            const data = await res.json();
            if (data.success) {
                alert(`Approval recorded by ${activeAuth}`);
                fetchProposals();
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (e) { console.error("Approval failed", e); }
        setLoading(false);
    };

    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim().split(" ");

        return proposals.filter(p => {

            // 🔥 Parse metadata safely
            let details: any = null;
            try {
                details = p.data ? JSON.parse(p.data) : null;
            } catch { }

            // 🔥 Build searchable fields
            const fields = [
                // Status
                p.isLive ? "active validator" : "pending approval",

                // Proposal
                `proposal ${p.id}`,
                String(p.id),

                // Name
                p.moniker || "",
                details?.moniker || "",

                // Address
                p.address || "",

                // Metadata
                details?.website || "",
                details?.accreditation_id || "",
                details?.location || "",
                p.domain || ""
            ];

            const matchSearch = q.every(word =>
                fields.some(field => field.toLowerCase().includes(word))
            );

            const matchStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" ? p.isLive : !p.isLive);

            return matchSearch && matchStatus;
        });
    }, [proposals, searchQuery, statusFilter]);

    useEffect(() => { verifyAuthority(); }, [activeAuth]);
    useEffect(() => {
        fetchProposals();
        const interval = setInterval(fetchProposals, 4000);
        return () => clearInterval(interval);
    }, []);

    const auth = authorities[activeAuth];

    return (
        <div style={{
            minHeight: "100vh",
            backgroundColor: "#F8F9FA",
            fontFamily: "'Inter', sans-serif",
            color: "#0F172A"
        }}>

            {/* Top Bar */}
            <div style={{
                backgroundColor: "#0F2A4A",
                padding: "8px 0",
                textAlign: "center"
            }}>
                <p style={{ color: "#94A3B8", fontSize: 11, letterSpacing: "0.12em", margin: 0, fontWeight: 500 }}>
                    GOVERNMENT OF INDIA — PRAMAAN NETWORK — OFFICIAL GOVERNANCE PORTAL
                </p>
            </div>

            {/* Header */}
            <header style={{
                position: "sticky",
                top: 0,
                zIndex: 50,
                backgroundColor: "#fff",
                borderBottom: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
            }}>
                <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 32px" }}>
                    {/* Main header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                            {/* Emblem */}
                            <div style={{
                                width: 48, height: 48,
                                backgroundColor: "#0F2A4A",
                                borderRadius: 4,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0
                            }}>
                                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                                    <circle cx="14" cy="6" r="4" fill="#F59E0B" />
                                    <rect x="2" y="22" width="24" height="3" rx="1.5" fill="#CBD5E1" />
                                    <rect x="5" y="12" width="3" height="10" rx="1" fill="#CBD5E1" />
                                    <rect x="12.5" y="10" width="3" height="12" rx="1" fill="#CBD5E1" />
                                    <rect x="20" y="12" width="3" height="10" rx="1" fill="#CBD5E1" />
                                </svg>
                            </div>
                            <div>
                                <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", margin: 0, color: "#0F172A" }}>
                                    Pramaan Governance Portal
                                </h1>
                                <p style={{ fontSize: 11, color: "#64748B", margin: "2px 0 0", letterSpacing: "0.05em" }}>
                                    University Approval & Registry
                                </p>
                            </div>
                        </div>

                        {/* Authority Switcher */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginRight: 4 }}>SIGNING AS</span>
                            <div style={{
                                display: "flex",
                                border: "1px solid #E2E8F0",
                                borderRadius: 6,
                                overflow: "hidden",
                                backgroundColor: "#F8FAFC"
                            }}>
                                {(["MOE", "UGC", "NAAC"] as const).map(role => (
                                    <button key={role} onClick={() => setActiveAuth(role)} style={{
                                        padding: "8px 20px",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        letterSpacing: "0.06em",
                                        border: "none",
                                        borderRight: role !== "NAAC" ? "1px solid #E2E8F0" : "none",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        backgroundColor: activeAuth === role ? "#0F2A4A" : "transparent",
                                        color: activeAuth === role ? "#fff" : "#64748B",
                                    }}>
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Active Authority Bar */}
                    <div style={{
                        padding: "10px 0",
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        alignItems: "center",
                        gap: 8
                    }}>
                        <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            backgroundColor: auth.accent,
                            flexShrink: 0
                        }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{auth.label}</span>
                        <span style={{ color: "#CBD5E1", fontSize: 12 }}>•</span>
                        <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{auth.address}</span>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 32px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32 }}>

                    {/* Left: Proposal List */}
                    <div>
                        {/* Search + Filter Bar */}
                        <div style={{
                            backgroundColor: "#fff",
                            border: "1px solid #E2E8F0",
                            borderRadius: 8,
                            padding: 16,
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            marginBottom: 24
                        }}>
                            <div style={{ position: "relative", flex: 1 }}>
                                <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search by institution name or address..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px 9px 36px",
                                        fontSize: 13,
                                        border: "1px solid #E2E8F0",
                                        borderRadius: 6,
                                        outline: "none",
                                        backgroundColor: "#FAFAFA",
                                        boxSizing: "border-box",
                                        color: "#0F172A"
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: 4 }}>
                                {(["ALL", "PENDING", "ACTIVE"] as const).map(f => (
                                    <button key={f} onClick={() => setStatusFilter(f)} style={{
                                        padding: "7px 14px",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: "0.05em",
                                        borderRadius: 5,
                                        border: "1px solid",
                                        cursor: "pointer",
                                        transition: "all 0.15s",
                                        borderColor: statusFilter === f ? "#0F2A4A" : "#E2E8F0",
                                        backgroundColor: statusFilter === f ? "#0F2A4A" : "transparent",
                                        color: statusFilter === f ? "#fff" : "#64748B",
                                    }}>{f}</button>
                                ))}
                            </div>
                        </div>

                        {/* Section Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h2 style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", margin: 0 }}>
                                University Proposals
                            </h2>
                            <span style={{
                                fontSize: 12, color: "#64748B",
                                backgroundColor: "#F1F5F9",
                                border: "1px solid #E2E8F0",
                                borderRadius: 20,
                                padding: "3px 10px",
                                fontWeight: 500
                            }}>
                                {filtered.length} record{filtered.length !== 1 ? "s" : ""}
                            </span>
                        </div>

                        {filtered.length === 0
                            ? <EmptyState />
                            : filtered.map((p, i) => (
                                <ProposalCard
                                    key={i}
                                    p={p}
                                    activeAuth={activeAuth}
                                    loading={loading}
                                    onApprove={approveProposal}
                                    authorities={authorities}
                                />
                            ))
                        }
                    </div>

                    {/* Right: Authority Panel */}
                    <div>
                        <div style={{ position: "sticky", top: 120 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", letterSpacing: "0.1em", marginBottom: 12, marginTop: 0 }}>
                                ACTIVE AUTHORITY
                            </p>
                            <div style={{
                                backgroundColor: "#fff",
                                border: "1px solid #E2E8F0",
                                borderRadius: 8,
                                overflow: "hidden"
                            }}>
                                {/* Color band */}
                                <div style={{ height: 4, backgroundColor: auth.accent }} />

                                <div style={{ padding: 24 }}>
                                    {verifying ? (
                                        <div style={{ padding: "48px 0", textAlign: "center" }}>
                                            <div style={{
                                                width: 24, height: 24,
                                                border: "2px solid #E2E8F0",
                                                borderTopColor: "#0F2A4A",
                                                borderRadius: "50%",
                                                animation: "spin 0.8s linear infinite",
                                                margin: "0 auto 12px"
                                            }} />
                                            <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>Verifying on-chain identity...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ marginBottom: 20 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                                    <div style={{
                                                        width: 40, height: 40, borderRadius: 6,
                                                        backgroundColor: auth.accent + "18",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        flexShrink: 0
                                                    }}>
                                                        <span style={{ fontSize: 14, fontWeight: 700, color: auth.accent }}>{auth.short}</span>
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0F172A" }}>
                                                            {authorityInfo?.fn || authorityInfo?.n || auth.label}
                                                        </p>
                                                        <p style={{ fontSize: 11, color: "#64748B", margin: "2px 0 0" }}>{auth.label}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: "1px solid #F1F5F9" }}>
                                                <InfoRow label="Status">
                                                    <span style={{
                                                        display: "inline-flex", alignItems: "center", gap: 5,
                                                        fontSize: 12, fontWeight: 600,
                                                        color: "#065F46",
                                                        backgroundColor: "#D1FAE5",
                                                        padding: "3px 8px", borderRadius: 4
                                                    }}>
                                                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#059669", display: "inline-block" }} />
                                                        Active
                                                    </span>
                                                </InfoRow>
                                                <InfoRow label="Trust Tier">
                                                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                                                        {authorityInfo?.v || "Tier 1"}
                                                    </span>
                                                </InfoRow>
                                                <InfoRow label="Chain ID">
                                                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#475569" }}>
                                                        {authorityInfo?.id || "—"}
                                                    </span>
                                                </InfoRow>
                                                <InfoRow label="Portal">
                                                    <a href="#" style={{ fontSize: 12, color: "#1D4ED8", textDecoration: "underline" }}>
                                                        {authorityInfo?.url || "pramaan.gov.in"}
                                                    </a>
                                                </InfoRow>
                                            </div>

                                            <div style={{
                                                marginTop: 20, padding: 14,
                                                backgroundColor: "#F8FAFC",
                                                border: "1px solid #E2E8F0",
                                                borderRadius: 6
                                            }}>
                                                <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, margin: "0 0 6px", letterSpacing: "0.08em" }}>
                                                    BLOCKCHAIN ADDRESS
                                                </p>
                                                <p style={{
                                                    fontSize: 10, fontFamily: "monospace",
                                                    color: "#475569", wordBreak: "break-all",
                                                    margin: 0, lineHeight: 1.6
                                                }}>
                                                    {auth.address}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <StatCard
                                    label="Total Proposals"
                                    value={proposals.length}
                                />
                                <StatCard
                                    label="Active University"
                                    value={proposals.filter(p => p.isLive).length}
                                    accent="#065F46"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                * { box-sizing: border-box; }
                input::placeholder { color: #94A3B8; }
            `}</style>
        </div>
    );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "10px 0",
            borderBottom: "1px solid #F1F5F9"
        }}>
            <span style={{ fontSize: 12, color: "#64748B" }}>{label}</span>
            {children}
        </div>
    );
}

function StatCard({ label, value, accent = "#0F2A4A" }: any) {
    return (
        <div style={{
            backgroundColor: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            padding: "14px 16px",
        }}>
            <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, margin: "0 0 4px", letterSpacing: "0.05em" }}>
                {label.toUpperCase()}
            </p>
            <p style={{ fontSize: 26, fontWeight: 700, margin: 0, color: accent, lineHeight: 1 }}>
                {value}
            </p>
        </div>
    );
}

function ProposalCard({ p, activeAuth, loading, onApprove, authorities }: any) {
    const approvals = p.approvals || [];

    const details = useMemo(() => {
        try { return p.data ? JSON.parse(p.data) : null; }
        catch { return null; }
    }, [p.data]);

    const votes = {
        moe: approvals.some((a: string) => a.trim() === authorities.MOE.address),
        ugc: approvals.some((a: string) => a.trim() === authorities.UGC.address),
        naac: approvals.some((a: string) => a.toLowerCase() === authorities.NAAC.address.toLowerCase()),
    };

    const isSignedByMe = approvals.some(
        (a: string) => a.trim() === authorities[activeAuth].address
    );
    const isActive = p.isLive === true || p.status === "ACTIVATED";
    const totalSigs = approvals.length;

    const [showIssuers, setShowIssuers] = useState(false);
    const [issuers, setIssuers] = useState<any[]>([]);

    useEffect(() => {
        if (isActive) {
            fetch(`http://localhost:4000/issuers/${p.address}`)
                .then(r => r.json())
                .then(d => setIssuers(d.issuers || []))
                .catch(console.error);
        }
    }, [isActive, p.address]);

    return (
        <div style={{
            backgroundColor: "#fff",
            border: `1px solid ${isActive ? "#A7F3D0" : "#E2E8F0"}`,
            borderRadius: 8,
            marginBottom: 16,
            overflow: "hidden",
            boxShadow: isActive ? "0 0 0 1px #D1FAE5" : "none"
        }}>
            {/* Status Bar */}
            <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 20px",
                backgroundColor: isActive ? "#ECFDF5" : "#F8FAFC",
                borderBottom: `1px solid ${isActive ? "#D1FAE5" : "#F1F5F9"}`
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                        display: "inline-block",
                        width: 7, height: 7, borderRadius: "50%",
                        backgroundColor: isActive ? "#059669" : "#F59E0B"
                    }} />
                    <span style={{
                        fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                        color: isActive ? "#065F46" : "#92400E"
                    }}>
                        {isActive ? "ACTIVE UNIVERSITY" : "PENDING APPROVAL"}
                    </span>
                </div>
                <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>
                    Proposal #{p.id}
                </span>
            </div>

            <div style={{ padding: "20px 20px 0" }}>
                {/* Institution Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                        <h3 style={{
                            fontSize: 18, fontWeight: 700, margin: "0 0 4px",
                            color: "#0F172A", letterSpacing: "-0.2px"
                        }}>
                            {details?.moniker || p.moniker || "Institution"}
                        </h3>
                        <p style={{ fontSize: 11, fontFamily: "monospace", color: "#94A3B8", margin: 0 }}>
                            {p.address?.slice(0, 28)}...
                        </p>
                    </div>

                    {/* Approval Signatures */}
                    <div style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 6 }}>
                            <ApprovalBadge label="MOE" active={votes.moe} color={authorities.MOE.accent} />
                            <ApprovalBadge label="UGC" active={votes.ugc} color={authorities.UGC.accent} />
                            <ApprovalBadge label="NAAC" active={votes.naac} color={authorities.NAAC.accent} />
                        </div>
                        <p style={{
                            fontSize: 11, margin: 0,
                            color: totalSigs >= 3 ? "#059669" : "#D97706",
                            fontWeight: 600
                        }}>
                            {totalSigs}/3 approvals
                        </p>
                    </div>
                </div>

                {/* Metadata Grid */}
                {details && (
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 1fr)",
                        gap: 1,
                        backgroundColor: "#F1F5F9",
                        border: "1px solid #E2E8F0",
                        borderRadius: 6,
                        overflow: "hidden",
                        marginBottom: 16
                    }}>
                        {[
                            { label: "Website", value: details.website },
                            { label: "Accreditation ID", value: details.accreditation_id || "N/A" },
                            { label: "Location", value: details.location || "India" },
                            { label: "Domain", value: p.domain },
                        ].map((item, i) => (
                            <div key={i} style={{ backgroundColor: "#fff", padding: "10px 12px" }}>
                                <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, margin: "0 0 3px", letterSpacing: "0.07em" }}>
                                    {item.label.toUpperCase()}
                                </p>
                                <p style={{
                                    fontSize: 12, fontWeight: 600, margin: 0,
                                    color: item.label === "Website" ? "#1D4ED8" : "#0F172A",
                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                }}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Action Area */}
                <div style={{ padding: "12px 0", borderTop: "1px solid #F1F5F9" }}>
                    {!isActive ? (
                        <button
                            onClick={() => onApprove(p.id)}
                            disabled={loading || isSignedByMe}
                            style={{
                                width: "100%",
                                padding: "11px 0",
                                fontSize: 13,
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                                borderRadius: 6,
                                border: "none",
                                cursor: isSignedByMe ? "not-allowed" : "pointer",
                                transition: "all 0.15s",
                                backgroundColor: isSignedByMe ? "#F1F5F9" : "#0F2A4A",
                                color: isSignedByMe ? "#94A3B8" : "#fff",
                            }}
                        >
                            {isSignedByMe
                                ? "✓  Approval already submitted"
                                : `Approve as ${activeAuth}`}
                        </button>
                    ) : (
                        <div style={{ display: "flex", gap: 10 }}>
                            <div style={{
                                flex: "0 0 auto",
                                backgroundColor: "#F8FAFC",
                                border: "1px solid #E2E8F0",
                                borderRadius: 6,
                                padding: "10px 20px",
                                textAlign: "center"
                            }}>
                                <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, margin: "0 0 2px" }}>DEPARTMENTS</p>
                                <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0F172A" }}>{issuers.length}</p>
                            </div>
                            <button
                                onClick={() => setShowIssuers(!showIssuers)}
                                style={{
                                    flex: 1,
                                    padding: "10px 16px",
                                    fontSize: 13, fontWeight: 600,
                                    borderRadius: 6,
                                    border: "1px solid #A7F3D0",
                                    cursor: "pointer",
                                    backgroundColor: "#ECFDF5",
                                    color: "#065F46",
                                    transition: "all 0.15s"
                                }}
                            >
                                {showIssuers ? "Hide Department Registry" : "View Department Registry"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Issuer Expand */}
            {showIssuers && (
                <div style={{
                    padding: "16px 20px 20px",
                    backgroundColor: "#FAFAFA",
                    borderTop: "1px solid #E2E8F0",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10
                }}>
                    {issuers.map((iss: any, idx: number) => (
                        <div key={idx} style={{
                            backgroundColor: "#fff",
                            border: "1px solid #E2E8F0",
                            borderRadius: 6,
                            padding: 14
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                                    color: "#0F2A4A", backgroundColor: "#EFF6FF",
                                    padding: "2px 6px", borderRadius: 3
                                }}>ISSUER</span>
                                <span style={{
                                    width: 8, height: 8, borderRadius: "50%",
                                    backgroundColor: iss.active ? "#059669" : "#EF4444",
                                    display: "inline-block", alignSelf: "center"
                                }} />
                            </div>
                            <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", margin: "0 0 6px" }}>
                                {iss.domain || "Academic Department"}
                            </p>
                            <p style={{
                                fontSize: 10, fontFamily: "monospace", color: "#94A3B8",
                                margin: 0, wordBreak: "break-all", lineHeight: 1.5
                            }}>
                                {iss.address}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ApprovalBadge({ label, active, color }: any) {
    return (
        <div style={{
            width: 36, height: 24,
            borderRadius: 4,
            border: `1px solid ${active ? color : "#E2E8F0"}`,
            backgroundColor: active ? color + "18" : "#F8FAFC",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
            color: active ? color : "#CBD5E1",
            transition: "all 0.2s"
        }}>
            {label}
        </div>
    );
}

function EmptyState() {
    return (
        <div style={{
            backgroundColor: "#fff",
            border: "1px dashed #CBD5E1",
            borderRadius: 8,
            padding: "64px 32px",
            textAlign: "center"
        }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5" style={{ margin: "0 auto 12px", display: "block" }}>
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 4px", fontWeight: 500 }}>No proposals found</p>
            <p style={{ fontSize: 12, color: "#CBD5E1", margin: 0 }}>Waiting for data from the network</p>
        </div>
    );
}