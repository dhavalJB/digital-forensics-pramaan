const memory = require("../state/memory");
const { execSync } = require("child_process");
const yaml = require("js-yaml");

/* ================= HELPERS ================= */

function run(cmd) {
  try {
    const res = execSync(cmd, { encoding: "utf-8" });
    return JSON.parse(res);
  } catch (err) {
    console.error(`CLI Error: ${cmd}`, err.message);
    return {};
  }
}

function parse(m) {
  try {
    return typeof m === "string" ? JSON.parse(m) : m;
  } catch {
    return {};
  }
}

/* ================= CORE DATA FETCH ================= */

function getChainData() {
  const docs = run("pramaand query docreg query-documents --output json").documents || [];
  const validators = run("pramaand query validatorreg validators --output json").validators || [];
  const issuers = run("pramaand query issuer issuers --output json").issuers || [];
  const authorities = run("pramaand query authority authorities --output json").authorities || [];
  const proposals = run("pramaand query validatorreg proposals --output json").proposals || [];

  return {
    documents: docs.map((d) => ({ ...d, metadata: parse(d.metadata) })),
    validators,
    issuers,
    authorities,
    proposals,
  };
}

/* ================= EXPORTS ================= */

exports.search = async (q) => {
  const { documents } = getChainData();
  const lower = q.toLowerCase();
  return documents.filter(
    (d) =>
      d.id?.toLowerCase().includes(lower) ||
      d.hash?.toLowerCase().includes(lower) ||
      d.owner?.toLowerCase().includes(lower) ||
      d.issuer?.toLowerCase().includes(lower)
  );
};

exports.getDocument = async (id) => {
  const res = run(`pramaand query docreg get-document ${id} --output json`);
  return res.document || null;
};

exports.getDocumentByHash = async (hash) => {
  const res = run(`pramaand query docreg get-document-by-hash ${hash} --output json`);
  return res.document || null;
};

exports.getDocumentsByOwner = async (owner) => {
  const res = run(`pramaand query docreg documents-by-owner ${owner} --output json`);
  return res.documents || [];
};

exports.getDocumentsByIssuer = async (issuer) => {
  const res = run(`pramaand query docreg documents-by-issuer ${issuer} --output json`);
  return res.documents || [];
};

exports.getBlockTxs = async (height) => {
  const res = run(`pramaand query block ${height} --output json`);
  return res.block?.data?.txs || [];
};

exports.getTx = async (hash) => {
  const res = run(`pramaand query tx ${hash} --output json`);
  return res.tx_response || null;
};


function getChainData() {
  const docs = run("pramaand query docreg query-documents --output json").documents || [];
  const validators = run("pramaand query validatorreg validators --output json").validators || [];
  const issuers = run("pramaand query issuer issuers --output json").issuers || [];
  const authorities = run("pramaand query authority authorities --output json").authorities || [];
  const proposals = run("pramaand query validatorreg proposals --output json").proposals || [];

  return {
    documents: docs.map((d) => ({ ...d, metadata: parse(d.metadata) })),
    validators,
    issuers,
    authorities,
    proposals,
  };
}

exports.getBlock = async (height) => {
  try {
    // Correct Syntax: pramaand query block --type=height <number>
    const blockRes = execSync(`pramaand query block --type=height ${height} --output json`, { encoding: "utf-8" });
    const blockData = JSON.parse(blockRes);

    const txsRes = execSync(`pramaand query txs --query "tx.height=${height}" --output json`, { encoding: "utf-8" });
    const txsData = JSON.parse(txsRes);

    return {
      height: height,
      hash: blockData.block_id?.hash,
      time: blockData.block?.header?.time,
      txs: txsData.txs || [], 
      isBlock: true
    };
  } catch (e) {
    return { height, txs: [], error: e.message };
  }
};

/* ================= COMPREHENSIVE OVERVIEW & ANALYTICS ================= */

exports.getOverview = async () => {
  const chain = getChainData();
  const { documents, validators, issuers, authorities, proposals } = chain;

  const now = Date.now();
  const dayInMs = 86400000;
  const totalDocs = documents.length; // Explicitly defined here to avoid ReferenceError

  /* 1. Velocity & Growth Analytics */
  const docsLast24h = documents.filter((d) => (now - Number(d.timestamp || 0) * 1000) < dayInMs).length;
  
  const blocks = memory.getBlocks() || [];
  let avgBlockTime = 0;
  if (blocks.length > 1) {
    const totalTime = new Date(blocks[0].time).getTime() - new Date(blocks[blocks.length - 1].time).getTime();
    avgBlockTime = (totalTime / blocks.length / 1000).toFixed(2);
  }

  /* 2. Document Intelligence (SBT vs NFT) */
  const domainStats = {};
  const tokenTypeStats = { SBT: 0, NFT: 0 };
  const docsByIssuer = {};
  const docsByOwner = {};
  let totalMetadataSize = 0;

  documents.forEach((d) => {
    domainStats[d.type] = (domainStats[d.type] || 0) + 1;
    tokenTypeStats[d.token_type] = (tokenTypeStats[d.token_type] || 0) + 1;
    docsByIssuer[d.issuer] = (docsByIssuer[d.issuer] || 0) + 1;
    docsByOwner[d.owner] = (docsByOwner[d.owner] || 0) + 1;
    totalMetadataSize += JSON.stringify(d.metadata || {}).length;
  });

  /* 3. Validator & Issuer Concentration */
  const valDistribution = {};
  issuers.forEach((i) => {
    valDistribution[i.validator] = (valDistribution[i.validator] || 0) + 1;
  });

  const validatorHealth = validators.map((v) => ({
    address: v.operator_address || v.address,
    moniker: v.description?.moniker || "Unknown",
    issuerCount: valDistribution[v.operator_address] || 0,
    status: v.status
  }));

  /* 4. Top Lists */
  const topIssuers = Object.entries(docsByIssuer)
    .map(([issuer, count]) => ({ issuer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topOwners = Object.entries(docsByOwner)
    .map(([owner, count]) => ({ owner, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    latestBlock: memory.getLatestBlock(),
    blocks: blocks.slice(0, 20),
    events: (memory.getEvents() || []).slice(0, 30),
    documents: documents.slice(0, 50), // Send a subset for the list

    analytics: {
      velocity: {
        docs24h: docsLast24h,
        avgBlockTime: `${avgBlockTime}s`,
        tps: blocks.length > 0 ? (memory.getStats()?.totalTxs / (blocks.length * (avgBlockTime || 1))).toFixed(4) : 0
      },
      infrastructure: {
        totalMetadataBytes: totalMetadataSize,
        avgDocSize: totalDocs > 0 ? (totalMetadataSize / totalDocs).toFixed(2) : 0
      },
      governance: {
        activeProposals: proposals.filter(p => p.status === "PROPOSAL_STATUS_VOTING_PERIOD").length,
        totalProposals: proposals.length
      },
      tokenTypeStats,
      domainStats,
      topIssuers,
      topOwners,
      validatorHealth
    },

    stats: {
      documents: totalDocs,
      landDocs: domainStats["land"] || 0,
      educationDocs: domainStats["education"] || 0,
      transfers: documents.filter((d) => d.transferable).length,
      validators: validators.length,
      issuers: issuers.length,
      authorities: authorities.length,
      revokedIssuers: issuers.length - issuers.filter((i) => i.active).length,
      totalTxs: memory.getStats()?.totalTxs || 0,
      totalBlocks: blocks.length,
    },
  };
};