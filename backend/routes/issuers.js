const express = require("express");
const router = express.Router();

const controller = require("../controllers/issuerController");

router.get("/issuers", controller.getAll);
router.get("/issuers/:validator", controller.getByValidator);

router.post("/issuer/create", controller.create);
router.post("/issuer/login", controller.login);
router.post("/issuer/add", controller.add);
router.get("/issuer/profile/:address", controller.getProfile);

module.exports = router;