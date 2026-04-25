const yaml = require("js-yaml");
const { execPromise } = require("../core/executor");

exports.getStats = async () => {
  const [docs, issuers, validators] = await Promise.all([
    execPromise("pramaand query docreg query-documents"),
    execPromise("pramaand query issuer issuers"),
    execPromise("pramaand query validatorreg validators"),
  ]);

  return {
    documents: yaml.load(docs)?.documents?.length || 0,
    issuers: yaml.load(issuers)?.issuers?.length || 0,
    validators: yaml.load(validators)?.validators?.length || 0,
  };
};