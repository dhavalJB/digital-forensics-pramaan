const { execPromise } = require("../core/executor");
const { spawn } = require("child_process");
const yaml = require("js-yaml");
const crypto = require("crypto");
const { parseEvent } = require("../core/parser");

const HOME = "/home/dhaval/edu/.pramaand";

exports.getAllDocuments = async (query) => {
  const { issuer, owner } = query;
  const stdout = await execPromise("pramaand query docreg query-documents");
  const parsed = yaml.load(stdout);
  let docs = parsed.documents || [];

  if (issuer && owner) {
    // If both are provided, show documents where user is involved in either role
    docs = docs.filter((d) => 
      d.issuer === issuer || d.owner === owner
    );
  } else if (issuer) {
    docs = docs.filter((d) => d.issuer === issuer);
  } else if (owner) {
    docs = docs.filter((d) => d.owner === owner);
  }

  return {
    documents: docs.map((d) => ({
      id: d.id,
      owner: d.owner,
      issuer: d.issuer,
      status: d.status || "ISSUED",
      domain: d.domain || d.type || "education",
      metadata: typeof d.metadata === "string" ? JSON.parse(d.metadata) : d.metadata || {},
      hash: d.hash,
      timestamp: d.timestamp || null
    })),
  };
};

exports.getFullHistory = async (id) => {
  const issueQuery = `pramaand query txs --query "document.registered.doc_id='${id}'" -o json`;
  const transferQuery = `pramaand query txs --query "document_transferred.id='${id}'" -o json`;

  const [res1, res2] = await Promise.all([
    execPromise(issueQuery).catch(() => '{"txs":[]}'),
    execPromise(transferQuery).catch(() => '{"txs":[]}')
  ]);

  const timeline = [];
  const process = (out) => {
    const txs = JSON.parse(out).txs || [];
    txs.forEach(tx => {
      (tx.events || []).forEach(ev => {
        const parsed = parseEvent(ev, tx);
        if (parsed && (parsed.docId === id || parsed.id === id)) {
          timeline.push({ ...parsed, txhash: tx.txhash, height: Number(tx.height) });
        }
      });
    });
  };

  process(res1);
  process(res2);
  return { id, timeline: Array.from(new Map(timeline.map(t => [t.txhash, t])).values()).sort((a, b) => a.height - b.height) };
};

exports.registerDocument = async (body) => {
  return new Promise((resolve, reject) => {
    const { id, owner, metadata, type, issuerName } = body;
    const hash = crypto.createHash("sha256").update(JSON.stringify(metadata)).digest("hex");
    const child = spawn("pramaand", ["tx", "docreg", "register-document", id, hash, owner, body.issuerAddress, type, JSON.stringify(metadata), "--from", issuerName, "--chain-id", "pramaan-edu", "--fees", "1000stake", "--keyring-backend", "file", "--home", HOME, "-y"]);
    
    let output = "";
    child.stdout.on("data", d => output += d.toString());
    setTimeout(() => { child.stdin.write("123456789\n"); child.stdin.end(); }, 300);
    child.on("close", () => output.includes("code: 0") ? resolve({ success: true }) : reject(new Error(output)));
  });
};

// 🔁 TRANSFER
exports.transferDocument = (body) => {
  return new Promise((resolve, reject) => {
    const { id, newOwner, issuerName } = body;

    const child = spawn("pramaand", [
      "tx",
      "docreg",
      "transfer-document",
      id,
      newOwner,
      "--from",
      issuerName,
      "--chain-id",
      "pramaan-edu",
      "--fees",
      "1000stake",
      "--keyring-backend",
      "file",
      "--home",
      "/home/dhaval/edu/.pramaand",
      "-y",
    ]);

    let output = "";
    let error = "";

    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (error += d.toString()));

    child.stdin.write("123456789\n");
    child.stdin.end();

    child.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(error || output));
      }
      resolve({ success: true, result: output });
    });
  });
};
exports.verifyDocument = async (id) => {
  const stdout = await execPromise(
    "pramaand query docreg query-documents"
  );

  const parsed = yaml.load(stdout);
  const docs = parsed.documents || [];

  const doc = docs.find((d) => d.id === id);

  if (!doc) {
    return { valid: false, error: "Document not found" };
  }

  let metadata = {};
  try {
    metadata =
      typeof doc.metadata === "string"
        ? JSON.parse(doc.metadata)
        : doc.metadata || {};
  } catch {}

  let txhash = null;

  try {
    const txOut = await execPromise(
      `pramaand query txs --query "document.registered.doc_id='${id}'" -o json`
    );

    const txParsed = JSON.parse(txOut);
    const tx = txParsed.txs?.[0];
    if (tx) txhash = tx.txhash;
  } catch {}

  return {
    valid: true,
    document: {
      id: doc.id,
      owner: doc.owner,
      issuer: doc.issuer,
      status: doc.status || "ISSUED",
      domain: doc.domain || doc.doc_type || "education",
      metadata,
    },
    txhash,
  };
};