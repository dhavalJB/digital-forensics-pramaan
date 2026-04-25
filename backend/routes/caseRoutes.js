const express = require("express");
const router = express.Router();
const caseController = require("../controllers/caseController");

router.get("/cases/:address", caseController.getCases);
router.get("/case/:id", caseController.getCaseById);
router.get(
  "/case/:id/evidence/:eid",
  caseController.getEvidenceById
);

module.exports = router;