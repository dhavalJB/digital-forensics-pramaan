const service = require("../services/documentService");

exports.getAll = async (req, res) => {
  try {
    const data = await service.getAllDocuments(req.query);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.verify = async (req, res) => {
  try {
    const data = await service.verifyDocument(req.params.id);
    res.json(data);
  } catch (e) {
    res.json({ valid: false, error: e.message });
  }
};

exports.getFullHistory = async (req, res) => {
  try {
    const data = await service.getFullHistory(req.params.id);
    res.json(data);
  } catch (e) {
    res.json({ id: req.params.id, timeline: [] });
  }
};

exports.register = async (req, res) => {
  try {
    const data = await service.registerDocument(req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};

exports.transfer = async (req, res) => {
  try {
    const data = await service.transferDocument(req.body);
    res.json(data);
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
};