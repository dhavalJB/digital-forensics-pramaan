const service = require("../services/authorityService");

exports.getAll = async (req, res) => {
  try {
    const data = await service.getAuthorities();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = await service.createAuthority(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const data = await service.loginAuthority(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.approve = async (req, res) => {
  try {
    const data = await service.approveValidator(req.body);
    res.json(data);
  } catch (err) {
    console.error("❌ APPROVE ERROR FULL:", err);

    res.status(500).json({
      success: false,
      error: err?.message || err || "Unknown error",
    });
  }
};

exports.getDetails = async (req, res) => {
  try {
    const { address } = req.query; // Get address from URL params
    if (!address) return res.status(400).json({ error: "Address is required" });

    const data = await service.getAuthorityDetails(address);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};