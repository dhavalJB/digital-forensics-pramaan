const fs = require("fs");
const path = require("path");

const CASES_DIR = path.join(__dirname, "../cases");

// 🔍 READ ALL CASE FILES (ONLY ROOT JSON)
function getAllCases() {
  if (!fs.existsSync(CASES_DIR)) return [];

  const files = fs.readdirSync(CASES_DIR);

  return files
    .filter((file) => file.endsWith(".json")) // ✅ only root case files
    .map((file) => {
      const filePath = path.join(CASES_DIR, file);

      try {
        const data = fs.readFileSync(filePath);
        return JSON.parse(data);
      } catch (err) {
        console.error("❌ Failed to read case:", filePath);
        return null;
      }
    })
    .filter(Boolean);
}

// 🎯 FILTER CASES BY USER
exports.getCasesByAddress = (address, role) => {
  const cases = getAllCases();

  if (!address) return [];

  // 🔓 SUPERVISOR = full access
  if (role === "SUPERVISOR") {
    return cases;
  }

  return cases.filter((c) => {
    // ✅ IO (original assignment)
    if (c.meta?.assigned_io === address) return true;

    // ✅ Creator
    if (c.meta?.created_by === address) return true;

    // ✅ Members (CUSTODIAN / ANALYST / VERIFIER)
    if (c.members?.some((m) => m.address === address)) return true;

    return false;
  });
};

// 🔍 GET SINGLE CASE (ROOT)
exports.getCaseById = (caseId) => {
  const filePath = path.join(CASES_DIR, `${caseId}.json`);

  if (!fs.existsSync(filePath)) return null;

  return JSON.parse(fs.readFileSync(filePath));
};

// 🔥 FULL EVIDENCE FETCH (CORRECT WAY)
exports.getEvidenceByCase = (caseId) => {
  const evidenceDir = path.join(CASES_DIR, caseId, "evidence");

  if (!fs.existsSync(evidenceDir)) return [];

  const files = fs.readdirSync(evidenceDir);

  return files
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      try {
        const data = fs.readFileSync(path.join(evidenceDir, file));
        return JSON.parse(data);
      } catch (err) {
        console.error("❌ Failed to read evidence:", file);
        return null;
      }
    })
    .filter(Boolean);
};

exports.getEvidenceById = (caseId, evidenceId) => {
  const evidencePath = path.join(
    CASES_DIR,
    caseId,
    "evidence",
    `${evidenceId}.json`
  );

  if (!fs.existsSync(evidencePath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(evidencePath);
    return JSON.parse(data);
  } catch (err) {
    console.error("❌ Failed to read evidence:", evidenceId);
    return null;
  }
};