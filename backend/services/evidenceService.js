const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { execPromise } = require("../core/executor");
const CASES_DIR = path.join(__dirname, "../cases");
const HOME = "/home/dhaval/digital-forensics/.pramaand";

const { detectRoles } = require("./authService");
const authService = require("./authService");


// 🔐 HASH FILE
function hashFile(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// 🆔 GENERATE EVIDENCE ID
function generateEvidenceId() {
  return "EVID_" + Date.now().toString().slice(-6);
}

// 📂 ENSURE FOLDER STRUCTURE
function ensureCaseFolders(caseId) {
  const caseFolder = path.join(CASES_DIR, caseId);
  const evidenceDir = path.join(caseFolder, "evidence");
  const filesDir = path.join(caseFolder, "files");

  if (!fs.existsSync(caseFolder)) fs.mkdirSync(caseFolder);
  if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir);
  if (!fs.existsSync(filesDir)) fs.mkdirSync(filesDir);

  return { evidenceDir, filesDir };
}

// 📂 LOAD ROOT CASE
function loadCase(caseId) {
  const filePath = path.join(CASES_DIR, `${caseId}.json`);
  if (!fs.existsSync(filePath)) return null;

  return JSON.parse(fs.readFileSync(filePath));
}

// 💾 SAVE ROOT CASE
function saveCase(caseId, data) {
  const filePath = path.join(CASES_DIR, `${caseId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ⚡ EXEC CLI
function runCLI(command, args, passphrase) {
  return new Promise((resolve) => {
    const child = spawn(command, args);

    let output = "";
    let error = "";

    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (error += d.toString()));

    if (passphrase) {
      setTimeout(() => {
        child.stdin.write(passphrase + "\n");
        child.stdin.end();
      }, 200);
    }

    child.on("close", () => {
      resolve({
        success: !error,
        output,
        error,
      });
    });
  });
}

// ⛓️ ANCHOR EVIDENCE
async function anchorEvidenceOnChain({ evidenceId, caseId, hash, owner }) {
  const memo = JSON.stringify({
    type: "EVIDENCE_CREATE",
    evidence_id: evidenceId,
    case_id: caseId,
    hash,
    owner,
  });

  const tx = await runCLI(
    "pramaand",
    [
      "tx",
      "bank",
      "send",
      owner,
      owner,
      "1stake",
      "--from",
      "user_d73e305f",
      "--chain-id",
      "pramaan-edu",
      "--fees",
      "1000stake",
      "--note",
      memo,
      "--keyring-backend",
      "file",
      "--home",
      HOME,
      "-y",
    ],
    "123456789"
  );

  const txHashMatch = tx.output.match(/txhash:\s*([A-F0-9]+)/i);
  return txHashMatch ? txHashMatch[1] : null;
}

// ⏳ WAIT FOR TX
async function waitForTx(txHash) {
  for (let i = 0; i < 10; i++) {
    const res = await runCLI(
      "pramaand",
      ["query", "tx", txHash, "--type", "hash", "--home", HOME, "-o", "json"],
      null
    );

    try {
      const tx = JSON.parse(res.output);

      if (tx && tx.height && tx.height !== "0") {
        return {
          tx_hash: txHash,
          block_height: tx.height,
          timestamp: tx.timestamp,
        };
      }
    } catch {}

    await new Promise((r) => setTimeout(r, 1500));
  }

  return {
    tx_hash: txHash,
    block_height: null,
    timestamp: new Date().toISOString(),
  };
}

// 🚀 MAIN FUNCTION
exports.uploadEvidence = async ({ caseId, file, officer, lat, lng }) => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file");
  }

  const caseData = loadCase(caseId);
  if (!caseData) {
    throw new Error("Case not found");
  }

  // 🔐 HASH FIRST
  const hash = hashFile(file.buffer);

  // 🔍 DUPLICATE CHECK
  const existing = (caseData.evidence || []).find(
    (e) => e.hash === hash
  );

  if (existing) {
    return {
      success: false,
      error: "Duplicate evidence detected",
      existing_evidence_id: existing.evidence_id,
    };
  }

  const { evidenceDir, filesDir } = ensureCaseFolders(caseId);
  const evidenceId = generateEvidenceId();

  const ext = path.extname(file.originalname) || ".bin";
  const fileName = `${evidenceId}${ext}`;
  const filePath = path.join(filesDir, fileName);

  // 📂 CATEGORY
  let category = "UNKNOWN";
  if (file.mimetype?.startsWith("image")) category = "IMAGE";
  else if (file.mimetype?.startsWith("video")) category = "VIDEO";
  else if (file.mimetype?.startsWith("audio")) category = "AUDIO";
  else if (file.mimetype?.includes("pdf")) category = "DOCUMENT";

  const now = new Date().toISOString();

  // ⛓️ BLOCKCHAIN FIRST (CRITICAL)
  const txHash = await anchorEvidenceOnChain({
    evidenceId,
    caseId,
    hash,
    owner: officer,
  });

  if (!txHash) {
    throw new Error("Blockchain anchoring failed");
  }

  const proof = await waitForTx(txHash);

  const evidenceData = {
    evidence_id: evidenceId,
    case_id: caseId,

    type: file.mimetype,
    category,

    file_name: fileName,
    size: file.size,

    hash,

    integrity: {
      hash_algorithm: "SHA256",
      hash_verified: true,
    },

    collected_by: officer,
    collected_at: now,

    location: {
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    },

    ownership: {
      current_owner: officer,
      history: [
        {
          owner: officer,
          action: "COLLECTED",
          timestamp: now,
        },
      ],
    },

    chain_proof: proof,
  };

  try {
    fs.writeFileSync(filePath, file.buffer);

    const evidencePath = path.join(evidenceDir, `${evidenceId}.json`);
    fs.writeFileSync(evidencePath, JSON.stringify(evidenceData, null, 2));

    if (!caseData.evidence) caseData.evidence = [];

    caseData.evidence.push({
      evidence_id: evidenceId,
      hash,
      category,
      type: file.mimetype,
      collected_by: officer,
      timestamp: now,
      tx_hash: proof.tx_hash,
    });

    if (!caseData.timeline) caseData.timeline = [];

caseData.timeline.push({
  type: "EVIDENCE_COLLECTED",
  evidence_id: evidenceId,
  by: officer,
  timestamp: now,
  tx_hash: proof.tx_hash,
});

// 🔥 AUDIT UPDATE
if (!caseData.audit) caseData.audit = [];

caseData.audit.push({
  action: "EVIDENCE_ADDED",
  evidence_id: evidenceId,
  by: officer,
  timestamp: now,
  tx_hash: proof.tx_hash,
});

    saveCase(caseId, caseData);
  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    throw new Error("Failed to store evidence safely");
  }

  return {
    success: true,
    evidence_id: evidenceId,
    hash,
    tx_hash: proof.tx_hash,
  };
};

function runTx(from, keyName, memo) {
  return new Promise((resolve, reject) => {
    const child = spawn("pramaand", [
      "tx",
      "bank",
      "send",
      from,
      from,
      "1stake",
      "--note",
      memo,
      "--from",
      keyName,
      "--chain-id",
      "pramaan-edu",
      "--fees",
      "1000stake",
      "--keyring-backend",
      "file",
      "--home",
      HOME,
      "-y",
    ]);

    let output = "";

    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));

    child.stdin.write("123456789\n");
    child.stdin.end();

    child.on("close", () => {
      const match = output.match(/txhash:\s*([A-F0-9]+)/i);
      if (!match) return reject(new Error("TX failed"));
      resolve(match[1]);
    });
  });
}


exports.transferEvidence = async ({
  caseId,
  evidenceId,
  from,
  to,
  keyName,
  report, // 🔥 NEW
}) => {
  const evidencePath = path.join(
    CASES_DIR,
    caseId,
    "evidence",
    `${evidenceId}.json`
  );

  const casePath = path.join(CASES_DIR, `${caseId}.json`);

  // 🔒 FILE VALIDATION
  if (!fs.existsSync(evidencePath)) {
    throw new Error("Evidence not found");
  }

  if (!fs.existsSync(casePath)) {
    throw new Error("Case not found");
  }

  const evidence = JSON.parse(fs.readFileSync(evidencePath));
  const caseData = JSON.parse(fs.readFileSync(casePath));

  // 🔐 OWNERSHIP CHECK
  if (evidence.ownership.current_owner !== from) {
    throw new Error("Not current owner");
  }

  // 🔐 PREVENT MULTIPLE PENDING
  if (evidence.ownership.pending_owner) {
    throw new Error("Pending transfer exists");
  }

  // =========================
  // 🔐 ROLE FLOW CONFIG
  // =========================
  const ROLE_FLOW = {
    FORENSIC_OFFICER: ["CUSTODIAN"],
    CUSTODIAN: ["ANALYST"],
    ANALYST: ["CUSTODIAN"],
  };

  // =========================
  // 🔍 DETECT ROLE
  // =========================
  const fromProfile = await authService.getIssuerProfile(from);
  const toProfile = await authService.getIssuerProfile(to);

  const fromRole = fromProfile?.role;
  const toRole = toProfile?.role;

  console.log("TRANSFER DEBUG:", {
    from,
    to,
    fromRole,
    toRole,
  });

  // ❌ ROLE NOT FOUND
  if (!fromRole || !toRole) {
    throw new Error("Role not assigned");
  }

  // =========================
  // 🔥 HARD RULE: MUST GO THROUGH CUSTODIAN
  // =========================
  if (fromRole !== "CUSTODIAN" && toRole !== "CUSTODIAN") {
    throw new Error("Transfer must go through Custodian");
  }

  // ❌ BLOCK BACK TO FO
  if (toRole === "FORENSIC_OFFICER") {
    throw new Error("Cannot transfer back to Forensic Officer");
  }

  // ❌ INVALID FLOW
  if (!ROLE_FLOW[fromRole]?.includes(toRole)) {
    throw new Error(
      `Transfer not allowed: ${fromRole} → ${toRole}`
    );
  }

  // =========================
  // 🔥 REPORT RULE
  // =========================


const isAnalystSending = fromRole === "ANALYST";

if (isAnalystSending && !report) {
  throw new Error("Report required for analyst transfer");
}

  const now = new Date().toISOString();

  // =========================
  // 🔗 BLOCKCHAIN TX
  // =========================

  let reportHash = null;

  if (report) {
    reportHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(report))
      .digest("hex");
  }

  const memo = JSON.stringify({
    type: "EVIDENCE_TRANSFER_INIT",
    case_id: caseId,
    evidence_id: evidenceId,
    from,
    to,
    report_hash: reportHash,
  });

  const txHash = await runTx(from, keyName, memo);

  // =========================
  // 🧠 PENDING STATE
  // =========================
  evidence.ownership.pending_owner = to;

  evidence.ownership.history.push({
    action: "TRANSFER_INITIATED",
    from,
    to,
    report: report || null,
    timestamp: now,
    tx_hash: txHash,
  });

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  // =========================
  // 📜 CASE TIMELINE
  // =========================
 // =========================
// 📜 CASE TIMELINE
// =========================
if (!caseData.timeline) caseData.timeline = [];

const baseTime = new Date();

const reportTime = new Date(baseTime.getTime());
const transferTime = new Date(baseTime.getTime() + 1);

// 🔹 REPORT FIRST
if (report) {
  caseData.timeline.push({
    type: "EVIDENCE_REPORT_SUBMITTED",
    evidence_id: evidenceId,
    from,
    to,
    report,
    timestamp: reportTime.toISOString(),
    tx_hash: txHash,
  });
}

// 🔹 THEN TRANSFER
caseData.timeline.push({
  type: "EVIDENCE_TRANSFER_INITIATED",
  evidence_id: evidenceId,
  from,
  to,
  by: from,
  timestamp: transferTime.toISOString(),
  tx_hash: txHash,
});



  // =========================
  // 📜 AUDIT LOG
  // =========================
  if (!caseData.audit) caseData.audit = [];

  caseData.audit.push({
    action: "EVIDENCE_TRANSFER_INITIATED",
    evidence_id: evidenceId,
    from,
    to,
    timestamp: now,
    tx_hash: txHash,
  });

// =========================
// 📄 REPORT STORAGE 
// =========================
if (report) {
  if (!caseData.reports) caseData.reports = [];

  const reportId = "REP_" + Date.now();

  caseData.reports.push({
  report_id: reportId,
    case_id: caseId,
    evidence_id: evidenceId,

    from,
    to,

    role_from: fromRole,
    role_to: toRole,

    report,

    report_hash: reportHash,

    linked_tx: txHash,

    submitted_at: now,
  });

  if (report) {
  caseData.audit.push({
    action: "EVIDENCE_REPORT_SUBMITTED",
    evidence_id: evidenceId,
    from,
    to,
    timestamp: now,
    tx_hash: txHash,
  });
}

}

  // =========================
  // 👁️ MEMBERS UPDATE
  // =========================
  if (!caseData.members) caseData.members = [];

  const exists = caseData.members.find(
    (m) => m.address === to
  );

  if (!exists) {
    caseData.members.push({
      role: toRole,
      address: to,
      added_at: now,
    });
  }

  fs.writeFileSync(casePath, JSON.stringify(caseData, null, 2));

  return {
    success: true,
    status: "PENDING",
    message: "Transfer initiated. Awaiting acceptance.",
    tx_hash: txHash,
  };
};

exports.getIncomingTransfers = async (address) => {
  const incoming = [];

  const cases = fs.readdirSync(CASES_DIR);

  for (const caseId of cases) {
    const evidenceDir = path.join(CASES_DIR, caseId, "evidence");

    if (!fs.existsSync(evidenceDir)) continue;

    const files = fs.readdirSync(evidenceDir);

    for (const file of files) {
      const evidence = JSON.parse(
        fs.readFileSync(path.join(evidenceDir, file))
      );

      if (evidence.ownership?.pending_owner === address) {
        const lastTransfer = evidence.ownership.history
          .slice()
          .reverse()
          .find((h) => h.action === "TRANSFER_INITIATED");

        incoming.push({
          case_id: caseId,
          evidence_id: evidence.evidence_id,
          from: lastTransfer?.from,
          tx_hash: lastTransfer?.tx_hash,
          timestamp: lastTransfer?.timestamp,
        });
      }
    }
  }

  return {
    success: true,
    transfers: incoming,
  };
};

// 🔽 ACCEPT TRANSFER
exports.acceptEvidenceTransfer = async ({
  caseId,
  evidenceId,
  by,
  keyName,
}) => {
  const evidencePath = path.join(
    CASES_DIR,
    caseId,
    "evidence",
    `${evidenceId}.json`
  );

  const casePath = path.join(CASES_DIR, `${caseId}.json`);

  if (!fs.existsSync(evidencePath)) {
    throw new Error("Evidence not found");
  }

  const evidence = JSON.parse(fs.readFileSync(evidencePath));
  const caseData = JSON.parse(fs.readFileSync(casePath));

  // 🔐 VALIDATION
  if (evidence.ownership.pending_owner !== by) {
    throw new Error("Not authorized to accept");
  }

  const now = new Date().toISOString();

  // 🔗 BLOCKCHAIN TX
  const memo = JSON.stringify({
    type: "EVIDENCE_TRANSFER_ACCEPT",
    case_id: caseId,
    evidence_id: evidenceId,
    by,
  });

  const txHash = await runTx(by, keyName, memo);

  // ✅ FINAL OWNERSHIP
  evidence.ownership.current_owner = by;
  delete evidence.ownership.pending_owner;

  evidence.ownership.history.push({
    action: "TRANSFER_ACCEPTED",
    by,
    timestamp: now,
    tx_hash: txHash,
  });

  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));

  // 📜 CASE TIMELINE
  caseData.timeline.push({
    type: "EVIDENCE_ACCEPTED",
    evidence_id: evidenceId,
    by,
    timestamp: now,
    tx_hash: txHash,
  });

  // 📜 AUDIT
  caseData.audit.push({
    action: "EVIDENCE_ACCEPTED",
    evidence_id: evidenceId,
    by,
    timestamp: now,
    tx_hash: txHash,
  });

  fs.writeFileSync(casePath, JSON.stringify(caseData, null, 2));

  return {
    success: true,
    message: "Evidence accepted successfully",
    tx_hash: txHash,
  };
};