const { execPromise } = require("../core/executor");
const { parseEvent } = require("../core/parser");

// 🔗 GET TX BY HASH
exports.getTxByHash = async (hash) => {
  const out = await execPromise(`pramaand query tx ${hash} -o json`);

  const parsed = JSON.parse(out);
  const tx = parsed.tx_response || parsed;

  const height = tx.height;
  const events = [];

  const allEvents = [];

  if (tx.logs) {
    tx.logs.forEach((log) => {
      (log.events || []).forEach((e) => allEvents.push(e));
    });
  }

  if (tx.events) {
    tx.events.forEach((e) => allEvents.push(e));
  }

  allEvents.forEach((event) => {
    const parsed = parseEvent(event, tx);
    if (parsed) events.push(parsed);
  });

  return {
    success: true,
    hash,
    height,
    events,
  };
};

// 🔗 GET TX HASH BY DOC ID
exports.getTxHashByDocId = async (id) => {
  const out = await execPromise(
    `pramaand query txs --query "document.registered.doc_id='${id}'" -o json`
  );

  const parsed = JSON.parse(out);
  const tx = parsed.txs?.[0];

  if (!tx) {
    return {
      success: false,
      error: "No transaction found",
    };
  }

  return {
    success: true,
    txhash: tx.txhash,
  };
};

// 🔗 RECENT TXS
exports.getRecentTxs = async (query) => {
  const limit = Number(query.limit || 10);

  const statusOut = await execPromise("pramaand status");
  const parsed = JSON.parse(statusOut);

  let height = Number(parsed?.sync_info?.latest_block_height || 0);

  const txs = [];
  let scanned = 0;

  while (txs.length < limit && scanned < 50) {
    try {
      const out = await execPromise(
        `pramaand query txs --query "tx.height=${height}" -o json`
      );

      const parsedTx = JSON.parse(out);
      const list = parsedTx.txs || [];

      list.forEach((tx) => {
        if (txs.length < limit) {
          txs.push({
            hash: tx.txhash,
            height: Number(tx.height),
          });
        }
      });
    } catch {}

    height--;
    scanned++;
  }

  return { txs };
};