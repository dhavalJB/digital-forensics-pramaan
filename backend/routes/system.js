const express = require("express");
const router = express.Router();
const memory = require("../state/memory");

const systemController = require("../controllers/systemController");

router.get("/health", systemController.health);
router.get("/stats", systemController.stats);
router.get("/memory", (req, res) => {
  res.json(memory.getState());
});

module.exports = router;