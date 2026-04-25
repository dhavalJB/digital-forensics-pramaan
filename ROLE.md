ROLE → POWERS (STRICT)
1️⃣ FORENSIC_OFFICER (IO)
CREATE + CONTROL

Can:

✔ Create Case
✔ Create Evidence (hash + anchor)
✔ Link evidence to case
✔ Initiate transfer
✔ View own + assigned cases

Cannot:

❌ Accept custody (unless also custodian)
❌ Analyze
❌ Verify in court
2️⃣ CUSTODIAN
STORE + CHAIN

Can:

✔ Accept evidence
✔ Store evidence
✔ Transfer evidence forward
✔ View custody logs

Cannot:

❌ Create evidence
❌ Analyze
❌ Verify
3️⃣ ANALYST
ANALYZE + REPORT

Can:

✔ Receive evidence (for analysis)
✔ Add analysis report
✔ Attach findings
✔ View assigned evidence

Cannot:

❌ Create evidence
❌ Transfer custody (optional: restrict)
❌ Verify
4️⃣ VERIFIER (Court)
FINAL AUTHORITY

Can:

✔ View full case
✔ Verify hash integrity
✔ Validate custody chain
✔ Accept / Reject evidence

Cannot:

❌ Modify anything
❌ Create / transfer
5️⃣ SUPERVISOR
GLOBAL READ-ONLY AUDIT

Can:

✔ View ALL cases
✔ View ALL evidence
✔ View custody chain
✔ View reports

Cannot:

❌ No write actions at all
🔥 ACTION → ROLE MATRIX
Action	FO	CUS	ANA	SUP	VER
Create Case	✅	❌	❌	❌	❌
Create Evidence	✅	❌	❌	❌	❌
Transfer Evidence	✅	✅	❌	❌	❌
Accept Evidence	❌	✅	(optional)	❌	❌
Analyze Evidence	❌	❌	✅	❌	❌
Upload Report	❌	❌	✅	❌	❌
View Case	✅	✅	✅	✅	✅
Verify Evidence	❌	❌	❌	❌	✅
Audit System	❌	❌	❌	✅	❌
🔥 FLOW (END-TO-END)
Step 1 — Create Evidence
FORENSIC_OFFICER
→ upload file
→ hash generated
→ tx: createEvidence
Step 2 — Transfer to Custodian
FO → CUSTODIAN
→ tx: transferEvidence
→ pending
→ custodian accepts
Step 3 — Storage
CUSTODIAN
→ marks stored
→ custody log updated
Step 4 — Send to Analyst
CUSTODIAN → ANALYST
→ transfer
→ analyst accepts
Step 5 — Analysis
ANALYST
→ uploads report
→ tx: attachReport
Step 6 — Court Verification
VERIFIER
→ checks hash + chain
→ tx: verifyEvidence

Dashboard
Entry + summary + profile
Cases
Case creation + ownership (FO)
Evidence
Core object creation (FO)
Chain of Custody
Immutable timeline (ALL read)
Transfers
Movement of evidence (FO + Custodian)
Reports
Analysis output (Analyst)
Verification
Court validation (Verifier)
Audit Logs
System-wide visibility (Supervisor)


Create → Store → Transfer → Analyze → Verify
   FO      CUS      FO/CUS     ANA        VER
                    (SUP = read-only everywhere)