const state = {
  latestBlock: 0,
  blocks: [],
  txs: [],
  events: [],
  stats: {
    totalTxs: 0,
    documents: 0,
    transfers: 0,
    validators: 0,
  },

  // 🔥 NEW INDEXES (PHASE 4)
  docs: {},        // docId → doc
  txMap: {},       // txhash → tx
  addresses: {},   // address → activity
};

// -----------------------------
// 🔄 SETTERS (EXISTING)
// -----------------------------
exports.setLatestBlock = (height) => {
  state.latestBlock = height;
};

exports.setBlocks = (blocks) => {
  state.blocks = blocks;
};

exports.setTxs = (txs) => {
  state.txs = txs;
};

exports.setEvents = (events) => {
  state.events = events;
};

exports.setStats = (stats) => {
  state.stats = stats;
};

// -----------------------------
// 📥 GETTERS (EXISTING)
// -----------------------------
exports.getState = () => state;
exports.getLatestBlock = () => state.latestBlock;
exports.getBlocks = () => state.blocks;
exports.getTxs = () => state.txs;
exports.getEvents = () => state.events;
exports.getStats = () => state.stats;

// =============================
// 🚀 PHASE 4 INDEX FUNCTIONS
// =============================

// 📄 DOCUMENT INDEX
exports.upsertDoc = (docId, data) => {
  state.docs[docId] = {
    ...(state.docs[docId] || {}),
    ...data,
  };
};

exports.getDoc = (docId) => {
  return state.docs[docId] || null;
};

exports.getAllDocs = () => {
  return Object.values(state.docs);
};

// 🔗 TX INDEX
exports.addTx = (hash, tx) => {
  state.txMap[hash] = tx;
};

exports.getTxByHash = (hash) => {
  return state.txMap[hash] || null;
};

// 👤 ADDRESS ACTIVITY INDEX
exports.addAddressActivity = (address, event) => {
  if (!state.addresses[address]) {
    state.addresses[address] = [];
  }

  state.addresses[address].unshift(event);

  // 🔥 limit memory
  if (state.addresses[address].length > 100) {
    state.addresses[address].pop();
  }
};

exports.getAddressActivity = (address) => {
  return state.addresses[address] || [];
};