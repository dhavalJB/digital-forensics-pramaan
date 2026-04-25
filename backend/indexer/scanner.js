const { execPromise } = require("../core/executor");
const memory = require("../state/memory");
const { processEvent } = require("./processor");

let LAST_HEIGHT = 0;
const PROCESSED_TXS = new Set(); // 🔥 dedup

async function startIndexer() {
  console.log("🚀 INDEXER STARTED");

  while (true) {
    try {
      const statusOut = await execPromise("pramaand status");
      const parsed = JSON.parse(statusOut);

      const latest = Number(
        parsed?.sync_info?.latest_block_height || 0
      );

      // 🔥 INIT
      if (!LAST_HEIGHT) {
        LAST_HEIGHT = Math.max(latest - 10, 0);
        console.log("⚡ Starting from:", LAST_HEIGHT);
      }

      // =============================
      // 🔄 NEW BLOCKS ONLY
      // =============================
      if (latest > LAST_HEIGHT) {
        for (let h = LAST_HEIGHT + 1; h <= latest; h++) {
          try {
            const txsOut = await execPromise(
              `pramaand query txs --query "tx.height=${h}" -o json`
            );

            let parsedTx;
            try {
              parsedTx = JSON.parse(txsOut);
            } catch {
              continue;
            }

            const txs = parsedTx.txs || [];

            // 🔥 track block list
            const blocks = memory.getBlocks();
            blocks.unshift({ height: h });
            if (blocks.length > 20) blocks.pop();
            memory.setBlocks(blocks);

            for (const tx of txs) {
              // 🔒 SKIP DUPLICATES
              if (PROCESSED_TXS.has(tx.txhash)) continue;
              PROCESSED_TXS.add(tx.txhash);

              memory.addTx(tx.txhash, tx);
const currentStats = memory.getStats();

memory.setStats({
  ...currentStats,
  totalTxs: currentStats.totalTxs + 1,
});
              

              let txDetail;
              try {
                const txDetailOut = await execPromise(
                  `pramaand query tx ${tx.txhash} -o json`
                );
                txDetail = JSON.parse(txDetailOut);
              } catch {
                continue;
              }

              const txResp = txDetail.tx_response || txDetail;

              const events = [];

              if (txResp.logs) {
                txResp.logs.forEach((l) =>
                  (l.events || []).forEach((e) => events.push(e))
                );
              }

              if (txResp.events && events.length === 0) {
                txResp.events.forEach((e) => events.push(e));
              }

              events.forEach((e) =>
                processEvent(e, tx, Number(tx.height || h))
              );
            }
          } catch (err) {
            console.log("BLOCK ERROR:", h);
          }
        }

        LAST_HEIGHT = latest;
        memory.setLatestBlock(latest);
      }

      // 🔥 CLEANUP (prevent memory leak)
      if (PROCESSED_TXS.size > 5000) {
        PROCESSED_TXS.clear();
      }

    } catch (e) {
      console.log("INDEXER ERROR:", e.message);
    }

    // ⏱ interval
    await new Promise((r) => setTimeout(r, 2000));
  }
}

module.exports = { startIndexer };