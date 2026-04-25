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

// ✅ FIX HERE — use evidenceController
router.get(
  "/case/:id/evidence",
  evidenceController.getEvidenceByCase
);

module.exports = router;