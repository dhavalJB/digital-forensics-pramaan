const express = require("express");
const router = express.Router();

const controller = require("../controllers/userController");

router.post("/users/create", controller.create);
router.post("/users/login", controller.login);

router.get("/users/documents/:address", controller.getDocuments);
router.get("/users/previously-owned/:address", controller.getPreviouslyOwned);

router.post("/users/transfer", controller.transfer);

module.exports = router;