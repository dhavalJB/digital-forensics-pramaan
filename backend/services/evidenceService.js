const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const CASES_DIR = path.join(__dirname, "../cases");
const HOME = "/home/dhaval/digital-forensics/.pramaand";

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
