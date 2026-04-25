const express = require("express");
const router = express.Router();

const controller = require("../controllers/authorityController");

router.get("/authorities", controller.getAll);
router.post("/authority/create", controller.create);
router.post("/authority/login", controller.login);
router.post("/authority/approve", controller.approve);
router.get("/authority/details", controller.getDetails);

module.exports = router;