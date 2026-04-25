const systemService = require("../services/systemService");

exports.health = (req, res) => {
  res.json({ status: "ok" });
};

exports.stats = async (req, res) => {
  try {
    const data = await systemService.getStats();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Stats failed" });
  }
};