const fs = require("fs");
const path = require("path");
const authService = require("./authService");

const CASES_DIR = path.join(__dirname, "../cases");

// ==============================
// 🔥 PROFILE RESOLVER (FULL DETAILS)
// ==============================
async function resolveProfileCached(address, cache) {
  if (!address) return null;

  if (cache[address]) return cache[address];

  const profile = await authService.getIssuerProfile(address);

  let result;

  if (!profile || !profile.exists) {
    result = {
      address,
      officer_name: "Unknown Officer",
      badge_id: "N/A",
      rank: "N/A",
      department: "N/A",
      police_station: "N/A",
      jurisdiction: "N/A",
      contact_number: "N/A",
      official_email: "N/A",
      role: "UNKNOWN",
    };
  } else {
    result = {
      address,
      officer_name: profile.officer_name,
      badge_id: profile.badge_id,
      rank: profile.rank,
      department: profile.department,
      police_station: profile.police_station,
      jurisdiction: profile.jurisdiction,
      contact_number: profile.contact_number,
      official_email: profile.official_email,
      role: profile.role,
    };
  }

  cache[address] = result;
  return result;
}

// ==============================
// 🔍 READ ALL CASE FILES
// ==============================
function getAllCasesRaw() {
  if (!fs.existsSync(CASES_DIR)) return [];

  const files = fs.readdirSync(CASES_DIR);

  return files
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const filePath = path.join(CASES_DIR, file);
      try {
        return JSON.parse(fs.readFileSync(filePath));
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

// ==============================
// 🔥 ENRICH SINGLE CASE
// ==============================
async function enrichCase(caseData, profileCache) {
  // 🔥 OFFICERS
  const officers = {
    investigating_officer: await resolveProfileCached(
      caseData.meta?.assigned_io,
      profileCache
    ),
    created_by: await resolveProfileCached(
      caseData.meta?.created_by,
      profileCache
    ),
  };

  // 🔥 MEMBERS
  const members = await Promise.all(
    (caseData.members || []).map(async (m) => ({
      role: m.role,
      profile: await resolveProfileCached(m.address, profileCache),
    }))
  );

  // 🔥 TIMELINE
  const timeline = await Promise.all(
    (caseData.timeline || []).map(async (t) => ({
      ...t,
      by_profile: await resolveProfileCached(t.by, profileCache),
      from_profile: await resolveProfileCached(t.from, profileCache),
      to_profile: await resolveProfileCached(t.to, profileCache),
    }))
  );

  // 🔥 EVIDENCE
  const evidenceDir = path.join(CASES_DIR, caseData.case_id, "evidence");

  let evidence = [];
  if (fs.existsSync(evidenceDir)) {
    const files = fs.readdirSync(evidenceDir);

    evidence = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (file) => {
          const ev = JSON.parse(
            fs.readFileSync(path.join(evidenceDir, file))
          );

          return {
            ...ev,
            collected_by_profile: await resolveProfileCached(
              ev.collected_by,
              profileCache
            ),
          };
        })
    );
  }

  return {
    ...caseData,
    officers,
    members,
    timeline,
    evidence,
  };
}

// ==============================
// 🎯 FILTER CASES BY USER
// ==============================
exports.getCasesByAddress = async (address, role) => {
  const cases = getAllCasesRaw();

  if (!address) return [];

  let filtered;

  if (role === "SUPERVISOR") {
    filtered = cases;
  } else {
    filtered = cases.filter((c) => {
      if (c.meta?.assigned_io === address) return true;
      if (c.meta?.created_by === address) return true;
      if (c.members?.some((m) => m.address === address)) return true;
      return false;
    });
  }

  // 🔥 ENRICH ALL
  const cache = {};

  return Promise.all(
    filtered.map((c) => enrichCase(c, cache))
  );
};

// ==============================
// 🔍 GET SINGLE CASE (ENRICHED)
// ==============================
exports.getCaseById = async (caseId) => {
  const filePath = path.join(CASES_DIR, `${caseId}.json`);
  if (!fs.existsSync(filePath)) return null;

  const caseData = JSON.parse(fs.readFileSync(filePath));

  const cache = {};
  return enrichCase(caseData, cache);
};

// ==============================
// 🔥 GET EVIDENCE BY ID (ENRICHED)
// ==============================
exports.getEvidenceById = async (caseId, evidenceId) => {
  const evidencePath = path.join(
    CASES_DIR,
    caseId,
    "evidence",
    `${evidenceId}.json`
  );

  if (!fs.existsSync(evidencePath)) return null;

  const ev = JSON.parse(fs.readFileSync(evidencePath));

  const cache = {};

  return {
    ...ev,
    collected_by_profile: await resolveProfileCached(
      ev.collected_by,
      cache
    ),
  };
};