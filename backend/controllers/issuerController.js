const service = require("../services/issuerService");

exports.getAll = async (req, res) => {
  res.json(await service.getIssuers());
};

exports.getByValidator = async (req, res) => {
  res.json(await service.getIssuersByValidator(req.params.validator));
};

exports.create = async (req, res) => {
  res.json(await service.createIssuer(req.body));
};

exports.login = async (req, res) => {
  res.json(await service.loginIssuer(req.body));
};

exports.add = async (req, res) => {
  res.json(await service.addIssuer(req.body));
};

exports.getProfile = async (req, res) => {
  const result = await service.getSingleIssuerDetails(req.params.address);
  res.json(result);
};