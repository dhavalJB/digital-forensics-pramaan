const evidenceService = require("../services/evidenceService");
const caseService = require("../services/caseService");

exports.uploadEvidence = async (req, res) => {
  try {
    const { case_id, officer, lat, lng } = req.body;

    if (!req.file) {
      return res.json({
        success: false,
        error: "File required",
      });
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
    console.error(err);

    res.json({
      success: false,
      error: err.message,
    });
  }
};

// ✅ FIXED VERSION
exports.getEvidenceByCase = (req, res) => {
  try {
    const { id } = req.params;

    const evidence = caseService.getEvidenceByCase(id);

    res.json({
      success: true,
      evidence,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: "Failed to fetch evidence",
    });
  }
};