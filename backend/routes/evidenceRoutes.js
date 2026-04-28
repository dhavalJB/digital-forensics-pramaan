const express = require("express");
const router = express.Router();
const multer = require("multer");

const evidenceController = require("../controllers/evidenceController");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/evidence/upload",
  upload.single("file"),
  evidenceController.uploadEvidence
);

router.get(
  "/case/:id/evidence",
  evidenceController.getEvidenceByCase
);

router.get(
  "/case/:id/evidence/:eid",
  evidenceController.getSingleEvidence
);

router.post("/evidence/transfer", evidenceController.transferEvidence);
router.post("/evidence/incoming", evidenceController.getIncomingTransfers);
router.post("/evidence/accept", evidenceController.acceptTransfer);

module.exports = router;