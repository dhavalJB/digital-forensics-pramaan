const express = require("express");
const router = express.Router();

const controller = require("../controllers/txController");

// 🔗 TRANSACTIONS
router.get("/tx/:hash", controller.getTx);
router.get("/txhash/:id", controller.getTxHashByDoc);
router.get("/txs/recent", controller.getRecent);

module.exports = router;