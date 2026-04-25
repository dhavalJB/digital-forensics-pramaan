const { execPromise } = require("../core/executor");
const CONFIG = require("../config/blockchain");

// ⛓ GET BLOCKS
exports.getBlocks = async (query) => {
  const limit = Number(query.limit || 10);

  const out = await execPromise(
    `pramaand status --home ${CONFIG.HOME}`
  );

  const latest = JSON.parse(out)?.sync_info?.latest_block_height;

  const blocks = [];
  for (let i = 0; i < limit; i++) {
    blocks.push({ height: Number(latest) - i });
  }

  return { blocks };
};

// ⛓ LATEST BLOCK
exports.getLatestBlock = async () => {
  const out = await execPromise(
    `pramaand status --home ${CONFIG.HOME}`
  );

  const parsed = JSON.parse(out);

  return {
    height: Number(parsed?.sync_info?.latest_block_height || 0),
  };
};

// ⛓ RECENT BLOCKS
exports.getRecentBlocks = async (query) => {
  const limit = Number(query.limit || 10);

  const out = await execPromise(
    `pramaand status --home ${CONFIG.HOME}`
  );

  const parsed = JSON.parse(out);

  const latest = Number(parsed?.sync_info?.latest_block_height || 0);

  const blocks = [];
  for (let i = 0; i < limit; i++) {
    blocks.push({ height: latest - i });
  }

  return { blocks };
};

// ⛓ BLOCK BY HEIGHT
exports.getBlockByHeight = async (height) => {
  const out = await execPromise(
    `pramaand query block --type=height ${height} --home ${CONFIG.HOME} -o json`
  );

  return {
    success: true,
    block: JSON.parse(out),
  };
};

// ⛓ BLOCK TXS
exports.getBlockTxs = async (height) => {
  const out = await execPromise(
    `pramaand query txs --query "tx.height=${height}" --limit 100 --home ${CONFIG.HOME} -o json`
  );

  const parsed = JSON.parse(out);
  const txs = parsed.txs || [];

  return {
    txs: txs.map((tx) => ({
      hash: tx.txhash,
      height: tx.height,
    })),
  };
};