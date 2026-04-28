const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const courtController = require("../controllers/courtController");

router.get("/full-case/:caseId", courtController.getFullCase);
router.post("/verify", upload.single("file"), courtController.verifyEvidence);

module.exports = router;