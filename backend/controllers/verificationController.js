const service = require("../services/verificationService");

// 🟢 Create request (Verifier)
exports.createRequest = async (req, res) => {
  try {
    const data = await service.createRequest(req.body);
    res.json({ success: true, data });
  } catch (err) {
    console.error("CREATE REQUEST ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 🟢 Get status (Verifier polling)
exports.getStatus = async (req, res) => {
  try {
    const data = await service.getStatus(req.params.nonce);
    res.json(data);
  } catch (err) {
    console.error("STATUS ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// 🟢 Get pending (User vault)
exports.getPending = async (req, res) => {
  try {
    const data = await service.getPending(req.params.address);
    res.json({ requests: data });
  } catch (err) {
    console.error("PENDING ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Approve (User)
exports.approve = async (req, res) => {
  try {
    const data = await service.approve(req.body);
    res.json(data);
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const data = await service.getHistory(req.params.address);
    res.json({ history: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};