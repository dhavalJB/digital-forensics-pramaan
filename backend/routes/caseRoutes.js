const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");

router.get("/cases/:address", caseController.getCases);
router.get("/case/:id", caseController.getCaseById);
router.get(
  "/case/:id/evidence/:eid",
  caseController.getEvidenceById
);
router.get(
  "/case/:caseId/evidence/:evidenceId",
  (req, res) => {
    const { caseId, evidenceId } = req.params;

    const evidence = evidenceController.getEvidenceById(
      caseId,
      evidenceId
    );

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: "Evidence not found",
      });
    }

    res.json({
      success: true,
      data: evidence,
    });
  }
);

module.exports = router;