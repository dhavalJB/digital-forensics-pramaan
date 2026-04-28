"use client";

import { useState, useEffect } from "react";

export default function UniversityNode() {
    const [created, setCreated] = useState<any>(null);
    const [login, setLogin] = useState({ name: "", passphrase: "" });
    const [validator, setValidator] = useState<any>(null);
    const [domain, setDomain] = useState("education");

    const [metadata, setMetadata] = useState({
        moniker: "",
        website: "",
        accreditation_id: "",
        location: ""
    });

    const [validators, setValidators] = useState<any[]>([]);
    const [issuerData, setIssuerData] = useState({
        officer_name: "",
        badge_id: "",
        rank: "",
        department: "",
        station: "",
        jurisdiction: "",
        contact: "",
        email: "",
        role: "",
        wallet: ""
    });
    const [issuers, setIssuers] = useState<any[]>([]);
    const [selectedIssuer, setSelectedIssuer] = useState<any>(null);
    const [issuerDocs, setIssuerDocs] = useState<any[]>([]);
    const [allProposals, setAllProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const TOTAL_REQUIRED_SIGNATURES = 3;

    const validatorEntry = validators.find(v => v.address === validator?.address);
    const myProposal = allProposals.find(p => p.applicant === validator?.address);
    const hasApplied = !!myProposal;
    const isApprovedByCouncil = (myProposal?.approvals?.length || 0) >= TOTAL_REQUIRED_SIGNATURES;
    const isNodeActive = validatorEntry?.isLive === true;
    const activeDomain = myProposal?.domain || domain;

    useEffect(() => {
        const saved = localStorage.getItem("validator");
        if (saved) setValidator(JSON.parse(saved));
    }, []);

    const fetchData = async () => {
        try {
            const vRes = await fetch("http://localhost:4000/validators");
            const vData = await vRes.json();
            setValidators(vData.validators || []);
            const pRes = await fetch("http://localhost:4000/proposals");
            const pData = await pRes.json();
            setAllProposals(pData.proposals || []);
        } catch (e) { console.error("Sync error:", e); }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (validator && isNodeActive) {
            fetch(`http://localhost:4000/issuers/${validator.address}`)
                .then(r => r.json())
                .then(d => setIssuers(d.issuers || []));
        }
    }, [validator, isNodeActive]);

    useEffect(() => {
        if (selectedIssuer) {
            fetch(`http://localhost:4000/documents?issuer=${selectedIssuer.address}`)
                .then(r => r.json())
                .then(d => setIssuerDocs(d.documents || []));
        }
    }, [selectedIssuer]);

    const createValidator = async () => {
        const res = await fetch("http://localhost:4000/validator/create", { method: "POST" });
        const data = await res.json();
        if (data.success) setCreated(data);
    };

    const loginValidator = async () => {
        const res = await fetch("http://localhost:4000/validator/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(login),
        });
        const data = await res.json();
        if (data.success) {
            setValidator(data);
            localStorage.setItem("validator", JSON.stringify(data));
        } else alert("Login failed. Please check your credentials.");
    };

    const applyValidator = async () => {
        if (!metadata.moniker || !metadata.website) return alert("University name and website are required.");
        setLoading(true);
        try {
            const res = await fetch("http://localhost:4000/validator/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: validator.name, domain, data: JSON.stringify(metadata) }),
            });
            const data = await res.json();
            if (data.success) fetchData();
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const activateValidator = async (proposalId: string) => {
        const res = await fetch("http://localhost:4000/validator/activate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: validator.name, proposalId }),
        });
        const data = await res.json();
        if (data.success) alert("Node activated successfully.");
    };

    const addIssuer = async () => {
        // ✅ Validation (minimum required)
        if (
            !issuerData.wallet ||
            !issuerData.officer_name ||
            !issuerData.badge_id
        ) {
            return alert("Officer Name, Badge ID and Wallet are required.");
        }

        // ✅ Forensic metadata (clean structured identity)
        const issuerMetadata = {
            officer_name: issuerData.officer_name,
            badge_id: issuerData.badge_id,
            rank: issuerData.rank,
            department: issuerData.department,
            station: issuerData.station,
            jurisdiction: issuerData.jurisdiction,
            contact: issuerData.contact,
            email: issuerData.email,
            role: issuerData.role,
            created_at: Date.now()
        };

        setLoading(true);

        try {
            const res = await fetch("http://localhost:4000/validator/add-issuer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    validatorName: validator.name,
                    issuerAddress: issuerData.wallet,
                    domain: activeDomain,
                    metadata: issuerMetadata
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert("Officer registered successfully.");

                // ✅ Reset form
                setIssuerData({
                    officer_name: "",
                    badge_id: "",
                    rank: "",
                    department: "",
                    station: "",
                    jurisdiction: "",
                    contact: "",
                    email: "",
                    role: "",
                    wallet: ""
                });

                fetchData();
            } else {
                alert(`Error: ${data.error}`);
            }

        } catch (e) {
            console.error(e);
            alert("Connection error. Please try again.");
        }

        setLoading(false);
    };

    // ── UNAUTHENTICATED VIEW ──────────────────────────────────────────────────
    if (!validator) {
        return (
            <div style={{ minHeight: "100vh", backgroundColor: "#F8F9FA", fontFamily: "'Inter', sans-serif" }}>
                {/* Top bar */}
                <div style={{ backgroundColor: "#0F2A4A", padding: "8px 0", textAlign: "center" }}>
                    <p style={{ color: "#94A3B8", fontSize: 11, letterSpacing: "0.12em", margin: 0, fontWeight: 500 }}>
                        GOVERNMENT OF INDIA — PRAMAAN NETWORK — UNIVERSITY NODE SETUP
                    </p>
                </div>

                <div style={{ maxWidth: 960, margin: "0 auto", padding: "48px 32px" }}>
                    {/* Page title */}
                    <div style={{ marginBottom: 36 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                            <div style={{
                                width: 40, height: 40, backgroundColor: "#0F2A4A",
                                borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                                    <circle cx="14" cy="6" r="4" fill="#F59E0B" />
                                    <rect x="2" y="22" width="24" height="3" rx="1.5" fill="#CBD5E1" />
                                    <rect x="5" y="12" width="3" height="10" rx="1" fill="#CBD5E1" />
                                    <rect x="12.5" y="10" width="3" height="12" rx="1" fill="#CBD5E1" />
                                    <rect x="20" y="12" width="3" height="10" rx="1" fill="#CBD5E1" />
                                </svg>
                            </div>
                            <div>
                                <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>University Node Setup</h1>
                                <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>Pramaan Network — Institution Registration</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                        {/* Step 1: Generate Keys */}
                        <div style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                            <div style={{ height: 3, backgroundColor: "#0F2A4A" }} />
                            <div style={{ padding: 28 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{
                                        width: 24, height: 24, borderRadius: "50%",
                                        backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700, color: "#1D4ED8", flexShrink: 0
                                    }}>1</span>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>Generate Node Keys</p>
                                </div>
                                <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20, marginTop: 6 }}>
                                    Create a new cryptographic identity for your institution on the Pramaan network.
                                </p>
                                <button onClick={createValidator} style={{
                                    width: "100%", padding: "10px 0", fontSize: 13, fontWeight: 600,
                                    backgroundColor: "#0F2A4A", color: "#fff", border: "none",
                                    borderRadius: 6, cursor: "pointer"
                                }}>
                                    Generate Keys
                                </button>

                                {created && (
                                    <div style={{
                                        marginTop: 16, padding: 14, backgroundColor: "#F0FDF4",
                                        border: "1px solid #A7F3D0", borderRadius: 6
                                    }}>
                                        <p style={{ fontSize: 10, fontWeight: 700, color: "#065F46", margin: "0 0 6px", letterSpacing: "0.06em" }}>
                                            NODE ADDRESS
                                        </p>
                                        <p style={{ fontSize: 11, fontFamily: "monospace", color: "#059669", wordBreak: "break-all", margin: 0 }}>
                                            {created.address}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 2: Sign In */}
                        <div style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                            <div style={{ height: 3, backgroundColor: "#1D4ED8" }} />
                            <div style={{ padding: 28 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <span style={{
                                        width: 24, height: 24, borderRadius: "50%",
                                        backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700, color: "#1D4ED8", flexShrink: 0
                                    }}>2</span>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", margin: 0 }}>Sign In to Node</p>
                                </div>
                                <p style={{ fontSize: 12, color: "#64748B", marginBottom: 20, marginTop: 6 }}>
                                    Connect to your existing node using your credentials.
                                </p>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <input
                                        placeholder="Node name / moniker"
                                        style={inputStyle}
                                        onChange={e => setLogin({ ...login, name: e.target.value })}
                                    />
                                    <input
                                        type="password"
                                        placeholder="Passphrase"
                                        style={inputStyle}
                                        onChange={e => setLogin({ ...login, passphrase: e.target.value })}
                                        onKeyDown={e => e.key === "Enter" && loginValidator()}
                                    />
                                    <button onClick={loginValidator} style={{
                                        width: "100%", padding: "10px 0", fontSize: 13, fontWeight: 600,
                                        backgroundColor: "#1D4ED8", color: "#fff", border: "none",
                                        borderRadius: 6, cursor: "pointer"
                                    }}>
                                        Sign In
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`* { box-sizing: border-box; } input::placeholder { color: #94A3B8; } input:focus { outline: none; border-color: #0F2A4A !important; }`}</style>
            </div>
        );
    }

    // ── AUTHENTICATED VIEW ────────────────────────────────────────────────────
    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F8F9FA", fontFamily: "'Inter', sans-serif", color: "#0F172A" }}>

            {/* Top bar */}
            <div style={{ backgroundColor: "#0F2A4A", padding: "8px 0", textAlign: "center" }}>
                <p style={{ color: "#94A3B8", fontSize: 11, letterSpacing: "0.12em", margin: 0, fontWeight: 500 }}>
                    GOVERNMENT OF INDIA — PRAMAAN NETWORK — UNIVERSITY NODE CONSOLE
                </p>
            </div>

            {/* Header */}
            <header style={{
                position: "sticky", top: 0, zIndex: 50,
                backgroundColor: "#fff", borderBottom: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}>
                <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 32px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <div style={{
                                width: 40, height: 40, backgroundColor: "#0F2A4A", borderRadius: 4,
                                display: "flex", alignItems: "center", justifyContent: "center"
                            }}>
                                <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                                    <circle cx="14" cy="6" r="4" fill="#F59E0B" />
                                    <rect x="2" y="22" width="24" height="3" rx="1.5" fill="#CBD5E1" />
                                    <rect x="5" y="12" width="3" height="10" rx="1" fill="#CBD5E1" />
                                    <rect x="12.5" y="10" width="3" height="12" rx="1" fill="#CBD5E1" />
                                    <rect x="20" y="12" width="3" height="10" rx="1" fill="#CBD5E1" />
                                </svg>
                            </div>
                            <div>
                                <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#0F172A" }}>University Node Console</p>
                                <p style={{ fontSize: 11, color: "#64748B", margin: 0 }}>Pramaan Network</p>
                            </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{
                                display: "flex", alignItems: "center", gap: 8,
                                backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0",
                                borderRadius: 6, padding: "6px 12px"
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: "50%",
                                    backgroundColor: "#0F2A4A",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 11, fontWeight: 700, color: "#fff"
                                }}>
                                    {validator.name?.[0]?.toUpperCase() || "U"}
                                </div>
                                <span style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", fontFamily: "monospace" }}>
                                    {validator.name}
                                </span>
                            </div>
                            <button onClick={() => { localStorage.removeItem("validator"); setValidator(null); }} style={{
                                padding: "7px 14px", fontSize: 12, fontWeight: 600,
                                border: "1px solid #E2E8F0", borderRadius: 6,
                                backgroundColor: "transparent", color: "#64748B", cursor: "pointer"
                            }}>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 32px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>

                    {/* LEFT: Governance Status Panel */}
                    <div style={{ position: "sticky", top: 88 }}>
                        <p style={{ ...sectionLabel, marginBottom: 12 }}>Governance Status</p>
                        <div style={{
                            backgroundColor: "#fff", border: "1px solid #E2E8F0",
                            borderRadius: 8, overflow: "hidden"
                        }}>
                            <div style={{ height: 3, backgroundColor: isNodeActive ? "#059669" : hasApplied ? "#D97706" : "#0F2A4A" }} />
                            <div style={{ padding: 24 }}>
                                {!hasApplied ? (
                                    // Submit Proposal Form
                                    <>
                                        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, marginTop: 0 }}>
                                            Submit your institution's details to apply for a validator node on the network.
                                        </p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                            <div>
                                                <label style={labelStyle}>University Name</label>
                                                <input placeholder="e.g. Delhi University" style={inputStyle}
                                                    onChange={e => setMetadata({ ...metadata, moniker: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Official Website</label>
                                                <input placeholder="e.g. https://du.ac.in" style={inputStyle}
                                                    onChange={e => setMetadata({ ...metadata, website: e.target.value })} />
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                <div>
                                                    <label style={labelStyle}>Accreditation ID</label>
                                                    <input placeholder="e.g. NAAC-001" style={inputStyle}
                                                        onChange={e => setMetadata({ ...metadata, accreditation_id: e.target.value })} />
                                                </div>
                                                <div>
                                                    <label style={labelStyle}>City / State</label>
                                                    <input placeholder="e.g. New Delhi" style={inputStyle}
                                                        onChange={e => setMetadata({ ...metadata, location: e.target.value })} />
                                                </div>
                                            </div>
                                            <button onClick={applyValidator} disabled={loading} style={{
                                                marginTop: 4, width: "100%", padding: "11px 0",
                                                fontSize: 13, fontWeight: 600,
                                                backgroundColor: loading ? "#94A3B8" : "#0F2A4A",
                                                color: "#fff", border: "none", borderRadius: 6,
                                                cursor: loading ? "not-allowed" : "pointer"
                                            }}>
                                                Submit Application
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // Proposal Status
                                    <>
                                        {/* Status badge */}
                                        <div style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "14px 16px",
                                            backgroundColor: isNodeActive ? "#ECFDF5" : "#FFFBEB",
                                            border: `1px solid ${isNodeActive ? "#A7F3D0" : "#FDE68A"}`,
                                            borderRadius: 6, marginBottom: 16
                                        }}>
                                            <div>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", margin: "0 0 3px", letterSpacing: "0.07em" }}>STATUS</p>
                                                <p style={{
                                                    fontSize: 14, fontWeight: 700, margin: 0,
                                                    color: isNodeActive ? "#065F46" : "#92400E"
                                                }}>
                                                    {isNodeActive ? "Active" : myProposal.status}
                                                </p>
                                            </div>
                                            <div style={{ textAlign: "right" }}>
                                                <p style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", margin: "0 0 3px", letterSpacing: "0.07em" }}>APPROVALS</p>
                                                <p style={{
                                                    fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "monospace",
                                                    color: isApprovedByCouncil ? "#059669" : "#D97706"
                                                }}>
                                                    {myProposal.approvals?.length || 0}/3
                                                </p>
                                            </div>
                                        </div>

                                        {/* Proposal metadata */}
                                        {myProposal.data && (() => {
                                            try {
                                                const d = JSON.parse(myProposal.data);
                                                return (
                                                    <div style={{
                                                        backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0",
                                                        borderRadius: 6, padding: 14, marginBottom: 16,
                                                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10
                                                    }}>
                                                        {Object.entries(d).map(([k, v]: any) => (
                                                            <div key={k}>
                                                                <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, margin: "0 0 2px", letterSpacing: "0.06em" }}>
                                                                    {k.replace(/_/g, " ").toUpperCase()}
                                                                </p>
                                                                <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            } catch { return null; }
                                        })()}

                                        {/* Approval signatures */}
                                        {(myProposal.approvals?.length || 0) > 0 && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                                                {myProposal.approvals.map((addr: string, idx: number) => (
                                                    <div key={idx} style={{
                                                        display: "flex", alignItems: "center", gap: 8,
                                                        padding: "8px 12px",
                                                        backgroundColor: "#F0FDF4", border: "1px solid #A7F3D0",
                                                        borderRadius: 5
                                                    }}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                        <span style={{ fontSize: 10, fontFamily: "monospace", color: "#065F46", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{addr}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Activate button */}
                                        {isApprovedByCouncil && !isNodeActive && (
                                            <button onClick={() => activateValidator(myProposal.id)} style={{
                                                width: "100%", padding: "11px 0", fontSize: 13, fontWeight: 600,
                                                backgroundColor: "#059669", color: "#fff", border: "none",
                                                borderRadius: 6, cursor: "pointer"
                                            }}>
                                                Activate Node
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Department Management */}
                    <div>
                        {isNodeActive ? (
                            <div>
                                {/* Add Department Form */}
                                <p style={{ ...sectionLabel, marginBottom: 12 }}>Register Department</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

                                    <input placeholder="Officer Name"
                                        style={inputStyle}
                                        onChange={e => setIssuerData({ ...issuerData, officer_name: e.target.value })}
                                    />

                                    <input placeholder="Badge ID"
                                        style={inputStyle}
                                        onChange={e => setIssuerData({ ...issuerData, badge_id: e.target.value })}
                                    />

                                    <input placeholder="Rank (Inspector / SI)"
                                        style={inputStyle}
                                        onChange={e => setIssuerData({ ...issuerData, rank: e.target.value })}
                                    />

                                    <input placeholder="Department (Cyber Crime / Forensics)"
                                        style={inputStyle}
                                        onChange={e => setIssuerData({ ...issuerData, department: e.target.value })}
                                    />

                                    <input placeholder="Police Station"
                                        style={inputStyle}
                                        onChange={e => setIssuerData({ ...issuerData, station: e.target.value })}
                                    />

                                    <input placeholder="Jurisdiction (State / City)"
                                        style={inputStyle}
                                        onChange={e => setIssuerData({ ...issuerData, jurisdiction: e.target.value })}
                                    />

                                    <input placeholder="Contact Number"
                                        style={inputStyle}
                                        onChange={e => setIssuerData({ ...issuerData, contact: e.target.value })}
                                    />

                                    <input placeholder="Official Email"
                                        style={inputStyle}
                                        onChange={e => setIssuerData({ ...issuerData, email: e.target.value })}
                                    />

                                    <select
                                        style={inputStyle}
                                        onChange={(e) =>
                                            setIssuerData({ ...issuerData, role: e.target.value })
                                        }
                                    >
                                        <option value="">Select Role</option>

                                        <option value="FORENSIC_OFFICER">Forensic Officer (IO)</option>
                                        <option value="CUSTODIAN">Evidence Custodian</option>
                                        <option value="ANALYST">Forensic Analyst</option>
                                        <option value="VERIFIER">Court Verifier</option>
                                    </select>

                                    <input placeholder="Wallet Address (pramaan1...)"
                                        style={{ ...inputStyle, fontFamily: "monospace" }}
                                        onChange={e => setIssuerData({ ...issuerData, wallet: e.target.value })}
                                    />

                                    <button
                                        onClick={addIssuer}
                                        disabled={loading}
                                        style={{
                                            marginTop: 12,
                                            width: "100%",
                                            padding: "12px 0",
                                            fontSize: 13,
                                            fontWeight: 600,
                                            backgroundColor: loading ? "#94A3B8" : "#0F2A4A",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 6,
                                            cursor: loading ? "not-allowed" : "pointer"
                                        }}
                                    >
                                        {loading ? "Registering..." : "Add Officer"}
                                    </button>

                                </div>

                                {/* Departments List */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                    <p style={{ ...sectionLabel, margin: 0 }}>Registered Departments</p>
                                    <span style={{
                                        fontSize: 12, color: "#64748B",
                                        backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0",
                                        borderRadius: 20, padding: "3px 10px", fontWeight: 500
                                    }}>
                                        {issuers.length} department{issuers.length !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                    {issuers.map((iss, idx) => (
                                        <div key={idx} style={{
                                            backgroundColor: "#fff",
                                            border: "1px solid #E2E8F0",
                                            borderRadius: 8, overflow: "hidden"
                                        }}>
                                            {/* Status bar */}
                                            <div style={{
                                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                                padding: "8px 16px",
                                                backgroundColor: "#F8FAFC", borderBottom: "1px solid #F1F5F9"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700,
                                                        color: "#0F2A4A", backgroundColor: "#EFF6FF",
                                                        padding: "2px 7px", borderRadius: 3, letterSpacing: "0.04em"
                                                    }}>
                                                        {iss.domain || activeDomain}
                                                    </span>
                                                    <span style={{ fontSize: 11, color: "#94A3B8" }}>Department #{idx + 1}</span>
                                                </div>
                                                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                    <span style={{
                                                        width: 6, height: 6, borderRadius: "50%",
                                                        backgroundColor: iss.active !== false ? "#059669" : "#EF4444",
                                                        display: "inline-block"
                                                    }} />
                                                    <span style={{
                                                        fontSize: 11, fontWeight: 600,
                                                        color: iss.active !== false ? "#065F46" : "#991B1B"
                                                    }}>
                                                        {iss.active !== false ? "Active" : "Revoked"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ padding: 18, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
                                                <div>
                                                    <p style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px", color: "#0F172A" }}>
                                                        {iss.moniker || "Department"}
                                                    </p>
                                                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                                                        <DeptMeta label="Head of Dept" value={iss.coordinator || "—"} />
                                                        <DeptMeta label="Email" value={iss.email || "—"} mono />
                                                    </div>
                                                    <p style={{
                                                        fontSize: 10, fontFamily: "monospace", color: "#94A3B8",
                                                        margin: "8px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                                                    }}>
                                                        {iss.address}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                                    <button
                                                        onClick={() => setSelectedIssuer(iss)}
                                                        style={{
                                                            padding: "7px 14px", fontSize: 11, fontWeight: 600,
                                                            color: "#1D4ED8", backgroundColor: "#EFF6FF",
                                                            border: "1px solid #BFDBFE", borderRadius: 5,
                                                            cursor: "pointer", whiteSpace: "nowrap"
                                                        }}>
                                                        View Records
                                                    </button>
                                                    <button style={{
                                                        padding: "7px 14px", fontSize: 11, fontWeight: 600,
                                                        color: "#fff", backgroundColor: "#DC2626",
                                                        border: "none", borderRadius: 5,
                                                        cursor: "pointer"
                                                    }}>
                                                        Revoke
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {issuers.length === 0 && (
                                        <div style={{
                                            backgroundColor: "#fff", border: "1px dashed #CBD5E1",
                                            borderRadius: 8, padding: "48px 32px", textAlign: "center"
                                        }}>
                                            <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 4px", fontWeight: 500 }}>No departments registered yet</p>
                                            <p style={{ fontSize: 12, color: "#CBD5E1", margin: 0 }}>Use the form above to register your first department.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* Locked state */
                            <div style={{
                                backgroundColor: "#fff", border: "1px dashed #CBD5E1",
                                borderRadius: 8, padding: "80px 32px", textAlign: "center"
                            }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: "50%",
                                    backgroundColor: "#F1F5F9", display: "flex", alignItems: "center",
                                    justifyContent: "center", margin: "0 auto 16px"
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0110 0v4" />
                                    </svg>
                                </div>
                                <p style={{ fontSize: 15, fontWeight: 700, color: "#94A3B8", margin: "0 0 8px" }}>
                                    Department management is locked
                                </p>
                                <p style={{ fontSize: 12, color: "#CBD5E1", margin: 0, maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
                                    Your node must receive 3 governance approvals and be activated before you can register departments.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Records Modal */}
            {selectedIssuer && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 100,
                    backgroundColor: "rgba(15, 42, 74, 0.7)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 24
                }}>
                    <div style={{
                        backgroundColor: "#fff", borderRadius: 8,
                        width: "100%", maxWidth: 720,
                        maxHeight: "85vh", display: "flex", flexDirection: "column",
                        overflow: "hidden", border: "1px solid #E2E8F0"
                    }}>
                        {/* Modal header */}
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "18px 24px", borderBottom: "1px solid #E2E8F0",
                            backgroundColor: "#F8FAFC"
                        }}>
                            <div>
                                <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#0F172A" }}>
                                    {selectedIssuer.moniker || "Department"} — Issued Records
                                </p>
                                <p style={{ fontSize: 10, fontFamily: "monospace", color: "#94A3B8", margin: "3px 0 0" }}>
                                    {selectedIssuer.address}
                                </p>
                            </div>
                            <button onClick={() => setSelectedIssuer(null)} style={{
                                padding: "7px 14px", fontSize: 12, fontWeight: 600,
                                border: "1px solid #E2E8F0", borderRadius: 5,
                                backgroundColor: "#fff", color: "#64748B", cursor: "pointer"
                            }}>
                                Close
                            </button>
                        </div>

                        {/* Modal body */}
                        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
                            {issuerDocs.length === 0 ? (
                                <div style={{ padding: "40px 0", textAlign: "center" }}>
                                    <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>No records found for this department.</p>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    {issuerDocs.map((doc, i) => (
                                        <div key={i} style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "12px 16px",
                                            backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0",
                                            borderRadius: 6, borderLeft: "3px solid #0F2A4A"
                                        }}>
                                            <div>
                                                <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", margin: "0 0 2px", letterSpacing: "0.06em" }}>DOCUMENT ID</p>
                                                <p style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 600, color: "#0F172A", margin: 0 }}>{doc.id}</p>
                                            </div>
                                            <span style={{
                                                fontSize: 10, fontWeight: 700,
                                                color: "#065F46", backgroundColor: "#D1FAE5",
                                                padding: "3px 8px", borderRadius: 4, letterSpacing: "0.04em"
                                            }}>
                                                {doc.status || "Verified"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`* { box-sizing: border-box; } input::placeholder { color: #94A3B8; } input:focus { outline: none; border-color: #0F2A4A !important; }`}</style>
        </div>
    );
}

// ── Shared style tokens ────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 600,
    color: "#64748B",
    marginBottom: 5,
    letterSpacing: "0.04em"
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    fontSize: 13,
    border: "1px solid #E2E8F0",
    borderRadius: 6,
    backgroundColor: "#FAFAFA",
    color: "#0F172A",
    transition: "border-color 0.15s",
    boxSizing: "border-box" as const
};

const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: "#94A3B8",
    letterSpacing: "0.1em",
    margin: 0,
    textTransform: "uppercase" as const
};

function DeptMeta({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div>
            <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, margin: "0 0 1px", letterSpacing: "0.06em" }}>
                {label.toUpperCase()}
            </p>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#0F172A", margin: 0, fontFamily: mono ? "monospace" : "inherit" }}>
                {value}
            </p>
        </div>
    );
}