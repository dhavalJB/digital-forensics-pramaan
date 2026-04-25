const service = require("../services/userService");

exports.create = async (req, res) => {
  res.json(await service.createUser(req.body));
};

exports.login = async (req, res) => {
  res.json(await service.loginUser(req.body));
};

exports.getDocuments = async (req, res) => {
  res.json(await service.getUserDocuments(req.params.address));
};

exports.getPreviouslyOwned = async (req, res) => {
  res.json(await service.getPreviouslyOwnedDocs(req.params.address));
};

exports.transfer = async (req, res) => {
  try {
    const result = await service.transferDocument(req.body);
    res.json(result);
  } catch (e) {
    console.error("TRANSFER ERROR:", e);
    res.status(500).json({ error: e.message });
  }
};