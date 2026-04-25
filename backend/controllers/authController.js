const authService = require("../services/authService");

exports.signup = async (req, res) => {
  try {
    const result = await authService.signup();
    res.json(result);
  } catch (err) {
    res.json({ success: false, error: "Signup failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const { name, passphrase } = req.body;

    if (!name || !passphrase) {
      return res.json({ success: false, error: "Missing credentials" });
    }

    const result = await authService.login({ name, passphrase });
    res.json(result);
  } catch (err) {
    res.json({ success: false, error: "Login failed" });
  }
};