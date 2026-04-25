const express = require("express");
const router = express.Router();

const controller = require("../controllers/validatorController");

router.get("/validators", controller.getAll);
router.get("/proposals", controller.getProposals);

router.post("/validator/create", controller.create);
router.post("/validator/login", controller.login);
router.post("/validator/apply", controller.apply);
router.post("/validator/activate", controller.activate);
router.post("/validator/add-issuer", controller.addIssuer);
router.post("/validator/revoke-issuer", controller.revokeIssuer);

module.exports = router;