const service = require("../services/txService");

exports.getTx = async (req, res) => {
  try {
    const data = await service.getTxByHash(req.params.hash);
    res.json(data);
  } catch {
    res.json({ success: false });
  }
};

exports.getTxHashByDoc = async (req, res) => {
  try {
    const data = await service.getTxHashByDocId(req.params.id);
    res.json(data);
  } catch {
    res.json({ success: false });
  }
};

exports.getRecent = async (req, res) => {
  try {
    const data = await service.getRecentTxs(req.query);
    res.json(data);
  } catch {
    res.json({ txs: [] });
  }
};