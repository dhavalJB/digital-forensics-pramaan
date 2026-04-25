const express = require("express");
const router = express.Router();

const controller = require("../controllers/eventController");

// ⚡ EVENTS
router.get("/events", controller.getLive);
router.get("/events/recent", controller.getRecent);

module.exports = router;