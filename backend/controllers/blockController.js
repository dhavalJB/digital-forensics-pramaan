const service = require("../services/blockService");

exports.getBlocks = async (req, res) => {
  try {
    const data = await service.getBlocks(req.query);
    res.json(data);
  } catch {
    res.json({ blocks: [] });
  }
};

exports.getLatest = async (req, res) => {
  try {
    const data = await service.getLatestBlock();
    res.json(data);
  } catch {
    res.json({ height: 0 });
  }
};

exports.getRecent = async (req, res) => {
  try {
    const data = await service.getRecentBlocks(req.query);
    res.json(data);
  } catch {
    res.json({ blocks: [] });
  }
};

exports.getByHeight = async (req, res) => {
  try {
    const data = await service.getBlockByHeight(req.params.height);
    res.json(data);
  } catch {
    res.json({ success: false });
  }
};

exports.getTxs = async (req, res) => {
  try {
    const data = await service.getBlockTxs(req.params.height);
    res.json(data);
  } catch {
    res.json({ txs: [] });
  }
};