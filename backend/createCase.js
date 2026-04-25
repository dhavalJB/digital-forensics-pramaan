const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ⚙️ CONFIG
const HOME = "/home/dhaval/digital-forensics/.pramaand";
const CHAIN_ID = "pramaan-edu";

const WALLET = "pramaan1snrsgmy290rta9784mu0m62vtu5rmflu940cus";
const KEY_NAME = "user_d73e305f";
const PASSPHRASE = "123456789";

// 📂 CASES DIRECTORY
const CASES_DIR = path.join(__dirname, "cases");
if (!fs.existsSync(CASES_DIR)) {
  fs.mkdirSync(CASES_DIR, { recursive: true });
}

// 🔐 HASH FUNCTION
function hashData(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
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
      const failed =
        error ||
        output.toLowerCase().includes("failed") ||
        output.toLowerCase().includes("error");

      resolve({
        success: !failed,
        output,
        error,
      });
    });
  });
}

// 🔁 WAIT FOR TX CONFIRMATION
async function waitForTx(txHash, retries = 10) {
  for (let i = 0; i < retries; i++) {
    const res = await runCLI(
      "pramaand",
      [
        "query",
        "tx",
        txHash,
        "--type",
        "hash",
        "--home",
        HOME,
        "-o",
        "json",
      ],
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

    console.log(`⏳ Waiting for tx confirmation (${i + 1})`);
    await new Promise((r) => setTimeout(r, 1500));
  }

  return null;
}

// 🚀 CREATE CASE
async function createCase() {
  const caseId = "CASE_" + Date.now().toString().slice(-6);

  const title = "Mobile Theft at Railway Station";
  const description =
    "A mobile phone was reported stolen from Platform 2 at Amreli Railway Station during evening hours. CCTV footage and on-site evidence collected.";

  const assignedOfficer =
    "pramaan1j5d3e7s99a4prl4nhe0jzgnnwk0em24cny6unp";

  const location = {
    place: "Amreli Railway Station",
    platform: "Platform 2",
    city: "Amreli",
    state: "Gujarat",
    country: "India",
  };

  const incidentTime = new Date().toISOString();

  const dataHash = hashData(
    JSON.stringify({
      title,
      description,
      assignedOfficer,
      location,
      incidentTime,
    })
  );

  const note = JSON.stringify({
    type: "CASE_CREATE",
    case_id: caseId,
    data_hash: dataHash,
    assigned_io: assignedOfficer,
  });

  console.log("📡 Creating Case On-Chain...");

  const tx = await runCLI(
    "pramaand",
    [
      "tx",
      "bank",
      "send",
      WALLET,
      WALLET,
      "1stake",
      "--from",
      KEY_NAME,
      "--chain-id",
      CHAIN_ID,
      "--fees",
      "1000stake",
      "--note",
      note,
      "--keyring-backend",
      "file",
      "--home",
      HOME,
      "-y",
    ],
    PASSPHRASE
  );

  if (!tx.success) {
    console.error("❌ TX FAILED:", tx.error || tx.output);
    return;
  }

  const txHashMatch = tx.output.match(/txhash:\s*([A-F0-9]+)/i);
  const txHash = txHashMatch ? txHashMatch[1] : null;

  if (!txHash) {
    console.error("❌ No TX Hash Found");
    return;
  }

  console.log("🔗 TX HASH:", txHash);

  const proof =
    (await waitForTx(txHash)) || {
      tx_hash: txHash,
      block_height: null,
      timestamp: new Date().toISOString(),
    };

  const caseData = {
    case_id: caseId,

    meta: {
      title,
      description,
      case_type: "DIGITAL_THEFT",
      priority: "HIGH",
      location,
      incident_time: incidentTime,
      created_by: WALLET,
      assigned_io: assignedOfficer,
      created_at: proof.timestamp,
      status: "ACTIVE",
    },

    officers: {
      investigating_officer: assignedOfficer,
      created_by: WALLET,
    },

    chain_proof: {
      case_creation: {
        ...proof,
        data_hash: dataHash,
      },
    },

    timeline: [
      {
        type: "CASE_CREATED",
        by: WALLET,
        assigned_to: assignedOfficer,
        timestamp: proof.timestamp,
        ...proof,
      },
    ],

    evidence: [],
    reports: [],

    audit: [
      {
        action: "CASE_CREATED",
        by: WALLET,
        assigned_to: assignedOfficer,
        timestamp: proof.timestamp,
        tx_hash: proof.tx_hash,
      },
    ],
  };

  const filePath = path.join(CASES_DIR, `${caseId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(caseData, null, 2));

  console.log("✅ Case Created:", caseId);
}

// 🧪 RUN
createCase();