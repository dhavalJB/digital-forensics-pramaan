const service = require("../services/validatorService");

exports.getAll = async (req, res) => {
  res.json(await service.getValidators());
};

exports.getProposals = async (req, res) => {
  const data = await service.getProposals();
  res.json(data);
};

exports.create = async (req, res) => {
  try {
    res.json(await service.createValidator());
  } catch (e) {
    console.error("CREATE ERROR:", e);
    res.status(500).json({ error: e.message });
  }
}

exports.login = async (req, res) => {
  res.json(await service.loginValidator(req.body));
};

exports.apply = async (req, res) => {
  const result = await service.applyValidator(req.body);
  res.json(result);
};

exports.activate = async (req, res) => {
  res.json(await service.activateValidator(req.body));
};

exports.addIssuer = async (req, res) => {
  res.json(await service.addIssuer(req.body));
};

exports.revokeIssuer = async (req, res) => {
  res.json(await service.revokeIssuer(req.body));
};