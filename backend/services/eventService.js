const { execPromise } = require("../core/executor");
const { parseEvent } = require("../core/parser");

let LIVE_EVENTS = [];

// ⚡ LIVE EVENTS
exports.getLiveEvents = async (limit) => {
  return {
    events: LIVE_EVENTS.slice(0, limit),
  };
};

// ⚡ RECENT EVENTS
exports.getRecentEvents = async () => {
  const out = await execPromise(
    `pramaand query txs --query "tx.height>0" --limit 50 -o json`
  );

  const txs = JSON.parse(out).txs || [];
  let events = [];

  txs.forEach((tx) => {
    (tx.events || []).forEach((event) => {
      const parsed = parseEvent(event, tx);
      if (parsed) events.push(parsed);
    });
  });

  events.sort((a, b) => (b.height || 0) - (a.height || 0));

  return { events };
};

// 🔥 LIVE PUSH
exports._pushLiveEvent = (event) => {
  LIVE_EVENTS.unshift(event);
  if (LIVE_EVENTS.length > 200) LIVE_EVENTS.pop();
};