const { execPromise } = require("./executor");
const { parseEvent } = require("./parser");
const memory = require("../state/memory");

let RUNNING = false;

async function startScanner() {
  if (RUNNING) return;
  RUNNING = true;

  console.log("🔥 SCANNER STARTED");

  while (true) {
    try {
      // -------------------------------
      // 🔥 1. LATEST BLOCK
      // -------------------------------
      const statusOut = await execPromise("pramaand status");
      const parsed = JSON.parse(statusOut);

      const latest = Number(
        parsed?.sync_info?.latest_block_height || 0
      );

      memory.setLatestBlock(latest);

      // -------------------------------
      // 🔥 2. RECENT BLOCKS
      // -------------------------------
      const blocks = [];
      for (let i = 0; i < 10; i++) {
        blocks.push({ height: latest - i });
      }
      memory.setBlocks(blocks);

      // -------------------------------
      // 🔥 3. FETCH RECENT TXS
      // -------------------------------
      const out = await execPromise(
        `pramaand query txs --query "tx.height>0" --limit 50 -o json`
      );

      const parsedTx = JSON.parse(out);
      const txs = parsedTx.txs || [];

      const events = [];

      // -------------------------------
      // 🔥 4. PROCESS TXS
      // -------------------------------
      for (const tx of txs) {
        try {
          const txDetailOut = await execPromise(
            `pramaand query tx ${tx.txhash} -o json`
          );

          const txDetail = JSON.parse(txDetailOut);
          const txResp = txDetail.tx_response || txDetail;

          const allEvents = [];

          // ✅ FROM LOGS (if exists)
          if (txResp.logs && txResp.logs.length > 0) {
            txResp.logs.forEach((log) => {
              (log.events || []).forEach((e) => {
                allEvents.push({
                  type: e.type,
                  attributes: e.attributes || [],
                });
              });
            });
          }

          // ✅ FROM EVENTS (IMPORTANT FIX)
          if (txResp.events && txResp.events.length > 0) {
            txResp.events.forEach((e) => {
              allEvents.push({
                type: e.type,
                attributes: e.attributes || [],
              });
            });
          }

          // -------------------------------
          // 🔥 5. PARSE EVENTS
          // -------------------------------
          allEvents.forEach((event) => {
            const parsedEvent = parseEvent(event, {
              ...tx,
              txhash: tx.txhash,
              height: Number(tx.height || 0),
            });

            if (parsedEvent) {
              events.push(parsedEvent);
            }
          });

        } catch (err) {
          // silent fail for individual tx
        }
      }

      // -------------------------------
      // 🔥 6. SORT + LIMIT
      // -------------------------------
      events.sort((a, b) => (b.height || 0) - (a.height || 0));

      const finalEvents = events.slice(0, 50);

      // -------------------------------
      // 🔥 7. STATS
      // -------------------------------
      const stats = {
        totalTxs: txs.length,
        documents: finalEvents.filter(e => e.type === "DOCUMENT_ISSUED").length,
        transfers: finalEvents.filter(e => e.type === "DOCUMENT_TRANSFERRED").length,
        validators: finalEvents.filter(e => e.type === "VALIDATOR_ACTIVATED").length,
      };

      // -------------------------------
      // 🔥 8. STORE IN MEMORY
      // -------------------------------
      memory.setEvents(finalEvents);
      memory.setStats(stats);

    } catch (err) {
      console.error("Scanner error:", err.message);
    }

    // -------------------------------
    // 🔥 LOOP DELAY
    // -------------------------------
    await sleep(3000);
  }
}

// -------------------------------
function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

module.exports = {
  startScanner,
};