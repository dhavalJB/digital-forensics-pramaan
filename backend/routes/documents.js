const express = require("express");
const router = express.Router();
const controller = require("../controllers/documentController");

// 📄 DOCUMENTS
// Verify that controller.getAll and others are actually defined functions
router.get("/documents", controller.getAll);
router.get("/verify/:id", controller.verify);
router.get("/documents/full-history/:id", controller.getFullHistory);

// 🔁 ACTIONS
router.post("/issuer/docreg", controller.register);
router.post("/document/transfer", controller.transfer);

module.exports = router;