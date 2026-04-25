const caseService = require("../services/caseService");
const authService = require("../services/authService");

exports.getCases = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.json({
        success: false,
        error: "Missing address",
      });
    }

    // 🔍 GET ROLE FROM PROFILE
    const profile = await authService.getIssuerProfile(address);

    const role = profile?.profile?.role || "USER";

    const cases = caseService.getCasesByAddress(address, role);

    res.json({
      success: true,
      cases,
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: "Failed to fetch cases",
    });
  }
};

exports.getCaseById = (req, res) => {
  try {
    const { id } = req.params;

    const caseData = caseService.getCaseById(id);

    if (!caseData) {
      return res.status(404).json({
        success: false,
        error: "Case not found",
      });
    }

    res.json({
      success: true,
      case: caseData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch case",
    });
  }
};

exports.getEvidenceById = (req, res) => {
  try {
    const { id, eid } = req.params;

    const evidence = caseService.getEvidenceById(id, eid);

    if (!evidence) {
      return res.status(404).json({
        success: false,
        error: "Evidence not found",
      });
    }

    res.json({
      success: true,
      evidence,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch evidence",
    });
  }
};