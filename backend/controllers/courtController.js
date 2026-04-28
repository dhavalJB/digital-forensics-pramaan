const courtService = require("../services/courtService");

exports.getFullCase = async (req, res) => {
  try {
    const { caseId } = req.params;

    const data = await courtService.getFullCaseForCourt(caseId);

    if (!data) {
      return res.json({
        success: false,
        error: "Case not found",
      });
    }

    res.json({
      success: true,
      case: data,
    });

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.message,
    });
  }
};

exports.verifyEvidence = async (req, res) => {
  try {
    const { case_id, evidence_id } = req.body;

    if (!case_id || !evidence_id || !req.file) {
      return res.json({
        success: false,
        error: "Missing required fields",
      });
    }

    const result = await courtService.verifyEvidence({
      caseId: case_id,
      evidenceId: evidence_id,
      filePath: req.file.path,
    });

    res.json({
      success: true,
      ...result,
    });

  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.message,
    });
  }
};