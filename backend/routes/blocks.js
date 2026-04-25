const express = require("express");
const router = express.Router();

const controller = require("../controllers/blockController");

// ⛓ BLOCKS
router.get("/blocks", controller.getBlocks);
router.get("/blocks/latest", controller.getLatest);
router.get("/blocks/recent", controller.getRecent);
router.get("/blocks/:height", controller.getByHeight);
router.get("/blocks/:height/txs", controller.getTxs);

module.exports = router;