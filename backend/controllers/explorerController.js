const memory = require("../state/memory");
const { execSync } = require("child_process");
const blockService = require("../services/blockService");

/* ================= HELPERS ================= */
function run(cmd) {
  try {
    const res = execSync(cmd, { encoding: "utf-8" });
    return JSON.parse(res);
  } catch (err) {
    console.error(`CLI Error: ${cmd}`, err.message);
    return null;
  }
}

function parse(m) {
  try { return typeof m === "string" ? JSON.parse(m) : m; } 
  catch { return {}; }
}

/* ================= CORE DATA FETCH ================= */
function getChainData() {
  const docs = run("pramaand query docreg query-documents --output json")?.documents || [];
  const validators = run("pramaand query validatorreg validators --output json")?.validators || [];
  const issuers = run("pramaand query issuer issuers --output json")?.issuers || [];
  const authorities = run("pramaand query authority authorities --output json")?.authorities || [];
  const proposals = run("pramaand query validatorreg proposals --output json")?.proposals || [];

  return {
    documents: docs.map((d) => ({ ...d, metadata: parse(d.metadata) })),
    validators,
    issuers,
    authorities,
    proposals,
  };
}

/* ================= EXPORTS ================= */

exports.getOverview = async (req, res) => {
  try {
    const chain = getChainData();
    const { documents, validators, issuers, authorities, proposals } = chain;
    const now = Date.now();
    const totalDocs = documents.length;

    // Analytics Logic
    const domainStats = {};
    const tokenTypeStats = { SBT: 0, NFT: 0 };
    const docsByOwner = {};
    let totalMetadataSize = 0;

    documents.forEach((d) => {
      domainStats[d.type] = (domainStats[d.type] || 0) + 1;
      tokenTypeStats[d.token_type || 'SBT'] = (tokenTypeStats[d.token_type || 'SBT'] || 0) + 1;
      docsByOwner[d.owner] = (docsByOwner[d.owner] || 0) + 1;
      totalMetadataSize += JSON.stringify(d.metadata || {}).length;
    });

    const blocks = memory.getBlocks() || [];
    const stats = memory.getStats() || {};

    res.json({
      latestBlock: memory.getLatestBlock(),
      blocks: blocks.slice(0, 20),
      events: (memory.getEvents() || []).slice(0, 30),
      documents: documents.slice(0, 50),
      analytics: {
        velocity: {
          docs24h: documents.filter((d) => (now - Number(d.timestamp || 0) * 1000) < 86400000).length,
          tps: stats.totalTxs > 0 ? (stats.totalTxs / (blocks.length || 1)).toFixed(4) : 0
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
        validatorHealth: validators.map(v => ({ moniker: v.description?.moniker || "Node", address: v.operator_address, status: v.status })),
        topOwners: Object.entries(docsByOwner).map(([owner, count]) => ({ owner, count })).sort((a, b) => b.count - a.count).slice(0, 10)
      },
      stats: {
        documents: totalDocs,
        validators: validators.length,
        issuers: issuers.length,
        authorities: authorities.length,
        totalTxs: stats.totalTxs || 0,
        totalBlocks: blocks.length
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// 🔥 FORENSIC: BLOCK DETAIL
// 🔥 FORENSIC: BLOCK DETAIL (Fixed for Pramaan CLI v3.0)
exports.getBlockDetail = async (req, res) => {
  try {
    const { height } = req.params;
    
    // 1. Get Block Header - Added --type=height 🛡️
    const blockRes = run(`pramaand query block --type=height ${height} --output json`);
    
    // 2. Get Transaction Details
    const txsRes = run(`pramaand query txs --query "tx.height=${height}" --output json`);

    if (!blockRes) return res.status(404).json({ error: "Block not found" });

    res.json({
      block_id: blockRes.block_id,
      block: blockRes.block,
      txs: txsRes?.txs || [], 
      total_count: txsRes?.total_count || "0"
    });
  } catch (e) {
    console.error("DEEP BLOCK SCAN ERROR:", e.message);
    res.status(500).json({ error: e.message });
  }
};

// 🔥 FORENSIC: TX DETAIL
exports.getTxDetail = async (req, res) => {
  try {
    const { hash } = req.params;
    const out = run(`pramaand query tx ${hash} --output json`);
    if (!out) return res.status(404).json({ error: "Transaction not found" });
    res.json(out.tx_response || out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// 🔥 FORENSIC: ISSUER DETAIL
exports.getIssuerDetail = async (req, res) => {
  try {
    const { address } = req.params;
    const out = run("pramaand query issuer issuers --output json");
    const issuer = (out?.issuers || []).find(i => i.address === address);
    if (!issuer) return res.status(404).json({ error: "Issuer not found" });
    res.json(issuer);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};