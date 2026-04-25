const service = require("../services/eventService");

exports.getLive = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const data = await service.getLiveEvents(limit);
    res.json(data);
  } catch (e) {
    res.json({ events: [] });
  }
};

exports.getRecent = async (req, res) => {
  try {
    const data = await service.getRecentEvents();
    res.json(data);
  } catch (e) {
    res.json({ events: [] });
  }
};