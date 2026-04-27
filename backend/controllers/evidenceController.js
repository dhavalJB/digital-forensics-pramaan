const evidenceService = require("../services/evidenceService");
const caseService = require("../services/caseService");

// ==============================
// UPLOAD
// ==============================
exports.uploadEvidence = async (req, res) => {
  try {
    const { case_id, officer, lat, lng } = req.body;

    if (!req.file) {
      return res.json({ success: false, error: "File required" });
    }

    const result = await evidenceService.uploadEvidence({
      caseId: case_id,
      file: req.file,
      officer,
      lat,
      lng,
    });

    res.json(result);
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

// ==============================
// GET EVIDENCE
// ==============================
exports.getEvidenceByCase = (req, res) => {
  try {
    const { id } = req.params;

    const evidence = caseService.getEvidenceByCase(id);

    res.json({ success: true, evidence });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// ==============================
// TRANSFER
// ==============================
exports.transferEvidence = async (req, res) => {
 console.log("BODY:", req.body);

  try {
    const { case_id, evidence_id, from, to, keyName, report } = req.body;

    const result = await evidenceService.transferEvidence({
      caseId: case_id,
      evidenceId: evidence_id,
      from,
      to,
      keyName,
      report,
    });

    res.json(result);
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
};

// ==============================
// INCOMING
// ==============================
exports.getIncomingTransfers = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.json({
        success: false,
        error: "Address required",
      });
    }

    const result = await evidenceService.getIncomingTransfers(address);

    res.json(result);
  } catch (err) {
    console.error(err);

    res.json({
      success: false,
      error: err.message,
    });
  }
};

// ==============================
// ACCEPT
// ==============================
exports.acceptTransfer = async (req, res) => {
  try {
    const { case_id, evidence_id, by, keyName } = req.body;

    if (!case_id || !evidence_id || !by || !keyName) {
      return res.json({
        success: false,
        error: "Missing fields",
      });
    }

    const result = await evidenceService.acceptEvidenceTransfer({
      caseId: case_id,
      evidenceId: evidence_id,
      by,
      keyName,
    });

    res.json(result);
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
    });
  }
};