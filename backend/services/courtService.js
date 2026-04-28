const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const caseService = require("./caseService");
const authService = require("./authService");

const CASES_DIR = path.join(__dirname, "../cases");


// 🔥 REQUEST CACHE (IMPORTANT)
async function resolveProfileCached(address, cache) {
  if (!address) return null;

  // ✅ already resolved
  if (cache[address]) {
    return cache[address];
  }

  const profile = await authService.getIssuerProfile(address);

  let result;

  if (!profile.exists) {
    result = {
      address,
      name: "Unknown",
      role: "UNKNOWN",
    };
  } else {
    result = {
      address,
      name: profile.officer_name,
      role: profile.role,
      department: profile.department,
      rank: profile.rank,
      station: profile.police_station,
    };
  }

  // 🔥 store in cache
  cache[address] = result;

  return result;
}

// 🔥 MAIN FUNCTION
exports.getFullCaseForCourt = async (caseId) => {
  const caseData = caseService.getCaseById(caseId);
  if (!caseData) return null;

  const evidence = caseService.getEvidenceByCase(caseId);

  // 🔥 CACHE OBJECT
  const profileCache = {};

  // ==============================
  // OFFICERS
  // ==============================
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

  // ==============================
  // MEMBERS
  // ==============================
  const members = await Promise.all(
    (caseData.members || []).map(async (m) => ({
      role: m.role,
      profile: await resolveProfileCached(m.address, profileCache),
    }))
  );

  // ==============================
  // TIMELINE
  // ==============================
  const timeline = await Promise.all(
    (caseData.timeline || []).map(async (t) => ({
      ...t,
      by_profile: await resolveProfileCached(t.by, profileCache),
      from_profile: await resolveProfileCached(t.from, profileCache),
      to_profile: await resolveProfileCached(t.to, profileCache),
    }))
  );

  // ==============================
  // EVIDENCE
  // ==============================
  const enrichedEvidence = await Promise.all(
    evidence.map(async (ev) => {
      const history = await Promise.all(
        (ev.ownership?.history || []).map(async (h) => ({
          ...h,
          by_profile: await resolveProfileCached(h.by, profileCache),
          from_profile: await resolveProfileCached(h.from, profileCache),
          to_profile: await resolveProfileCached(h.to, profileCache),
        }))
      );

      return {
        ...ev,
        collected_by_profile: await resolveProfileCached(
          ev.collected_by,
          profileCache
        ),
        ownership: {
          ...ev.ownership,
          current_owner_profile: await resolveProfileCached(
            ev.ownership?.current_owner,
            profileCache
          ),
          history,
        },
      };
    })
  );

  // ==============================
  // REPORTS
  // ==============================
  const reports = await Promise.all(
    (caseData.reports || []).map(async (r) => ({
      ...r,
      from_profile: await resolveProfileCached(r.from, profileCache),
      to_profile: await resolveProfileCached(r.to, profileCache),
    }))
  );

  return {
    case_id: caseData.case_id,
    meta: caseData.meta,
    officers,
    members,
    timeline,
    evidence: enrichedEvidence,
    reports,
    audit: caseData.audit,
  };
};

function generateHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

// 🔥 MAIN VERIFY
exports.verifyEvidence = async ({ caseId, evidenceId, filePath }) => {
  const evidence = caseService.getEvidenceById(caseId, evidenceId);
  if (!evidence) throw new Error("Evidence not found");

  const caseData = caseService.getCaseById(caseId);

  // 🔥 CACHE (IMPORTANT)
  const profileCache = {};

  // =========================
  // HASH CHECK
  // =========================
  const uploadedHash = generateHash(filePath);
  const originalHash = evidence.hash;
  const match = uploadedHash === originalHash;

  // =========================
  // CHAIN OF CUSTODY (FIXED)
  // =========================
  const chain = await Promise.all(
    (evidence.ownership?.history || []).map(async (h) => ({
      event: h.action,

      from: await resolveProfileCached(h.from, profileCache),
      to: await resolveProfileCached(h.to, profileCache),

      // 🔥 FIX: fallback logic
      by: await resolveProfileCached(
        h.by || h.owner || h.from,
        profileCache
      ),

      time: h.timestamp,
    }))
  );

  // =========================
  // REPORTS (FIXED)
  // =========================
  const reports = await Promise.all(
    (evidence.ownership?.history || [])
      .filter((h) => h.report)
      .map(async (h) => ({
        from: await resolveProfileCached(h.from, profileCache),
        to: await resolveProfileCached(h.to, profileCache),

        summary: h.report.summary,
        notes: h.report.notes,

        submitted_at: h.timestamp,
      }))
  );

  // =========================
  // AUDIT (NEW)
  // =========================
  const audit = await Promise.all(
    (caseData.audit || [])
      .filter((a) => a.evidence_id === evidenceId)
      .map(async (a) => ({
        action: a.action,
        by: await resolveProfileCached(a.by, profileCache),
        timestamp: a.timestamp,
      }))
  );

  // =========================
  // CLEANUP
  // =========================
  fs.unlinkSync(filePath);

  return {
    verification: {
      match,
      status: match ? "VERIFIED" : "TAMPERED",
      original_hash: originalHash,
      uploaded_hash: uploadedHash,
    },

    evidence: {
      evidence_id: evidence.evidence_id,
      file_name: evidence.file_name, 
      type: evidence.type,
      category: evidence.category,

      // 🔥 PROFILE FIX
      collected_by: await resolveProfileCached(
        evidence.collected_by,
        profileCache
      ),

      collected_at: evidence.collected_at,

      current_owner: await resolveProfileCached(
        evidence.ownership?.current_owner,
        profileCache
      ),
    },

    chain_of_custody: chain,
    reports,
    audit,

    statement: match
      ? "Evidence verified. No tampering detected."
      : "Evidence mismatch detected. Integrity compromised.",
  };
};