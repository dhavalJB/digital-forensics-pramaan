const express = require("express");
const router = express.Router();
const controller = require("../controllers/explorerController");

// Main Dashboard Data
router.get("/explorer/overview", controller.getOverview);

// Forensic Inspection Endpoints (Used by the "On-Chain Inspector" panel)
router.get("/block/:height", controller.getBlockDetail);
router.get("/tx/:hash", controller.getTxDetail);
router.get("/issuer/:address", controller.getIssuerDetail);

module.exports = router;