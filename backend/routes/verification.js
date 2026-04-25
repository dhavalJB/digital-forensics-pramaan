const express = require("express");
const router = express.Router();

const controller = require("../controllers/verificationController");

// 🔥 Verifier creates request
router.post("/verification/create", controller.createRequest);

// 🔥 Verifier checks status
router.get("/verification/status/:nonce", controller.getStatus);

// 🔥 User will use later
router.get("/verification/pending/:address", controller.getPending);
router.post("/verification/approve", controller.approve);

router.get("/verification/history/:address", controller.getHistory);

module.exports = router;