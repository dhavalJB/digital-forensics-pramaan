const { spawn } = require("child_process");
const { execPromise } = require("../core/executor");
const yaml = require("js-yaml");
const crypto = require("crypto");
const { fundAddress } = require("../core/provisioner");


// 👤 CREATE USER
exports.createUser = async () => {
  const name = "user_" + crypto.randomBytes(4).toString("hex");
  const passphrase = "123456789";

  return new Promise((resolve, reject) => {
    const child = spawn("pramaand", [
      "keys",
      "add",
      name,
      "--keyring-backend",
      "file",
      "--home",
      "/home/dhaval/edu/.pramaand",
    ]);

    let output = "";

    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));

    setTimeout(() => {
      child.stdin.write(passphrase + "\n");
      child.stdin.write(passphrase + "\n");
      child.stdin.end();
    }, 200);

    child.on("close", async (code) => {
      if (code !== 0) return reject(output);

      const address = output.match(/address:\s*(\S+)/)?.[1];

      // 🔥 ADD THIS BLOCK (MISSING PART)
      let isFunded = false;
      if (address) {
        console.log(`🏦 [SYSTEM] Funding user ${address}...`);
        isFunded = await fundAddress(address, "100000stake");
      }

      resolve({
        success: true,
        name,
        address,
        passphrase,
        funded: isFunded
      });
    });
  });
};

// 👤 LOGIN USER
exports.loginUser = async ({ name, passphrase }) => {
  return new Promise((resolve, reject) => {
    const child = spawn("pramaand", [
      "keys",
      "show",
      name,
      "-a",
      "--keyring-backend",
      "file",
      "--home",
      "/home/dhaval/edu/.pramaand",
    ]);

    let output = "";

    child.stdout.on("data", (d) => (output += d.toString()));

    child.stdin.write(passphrase + "\n");
    child.stdin.end();

    child.on("close", (code) => {
      if (code !== 0) return reject("Login failed");

      resolve({
        success: true,
        name,
        address: output.trim(),
      });
    });
  });
};

// 👤 USER DOCUMENTS
exports.getUserDocuments = async (address) => {
  const out = await execPromise(
    "pramaand query docreg query-documents"
  );

  const parsed = yaml.load(out);
  let docs = parsed.documents || [];

  docs = docs.filter((d) => d.owner === address);

  const normalized = docs.map((d) => {
    let meta = {};

    try {
      meta =
        typeof d.metadata === "string"
          ? JSON.parse(d.metadata)
          : d.metadata || {};
    } catch {
      meta = {};
    }

    return {
      id: d.id,
      owner: d.owner,
      issuer: d.issuer,
      status: d.status || "ISSUED",
      domain: d.domain || d.doc_type || d.type || "education",
      metadata: meta,
    };
  });

  return {
    documents: normalized,
  };
};

// 🔥 NEW — PREVIOUSLY OWNED DOCUMENTS (FIXED)
exports.getPreviouslyOwnedDocs = async (address) => {
  const transferQuery = `pramaand query txs --query "document_transferred.from='${address}'" -o json`;

  try {
    const out = await execPromise(transferQuery);
    const txs = JSON.parse(out).txs || [];

    const results = [];

    for (const tx of txs) {
      for (const event of tx.events || []) {
        if (event.type !== "document_transferred") continue;

        const attrs = {};
        (event.attributes || []).forEach((a) => {
          attrs[a.key] = a.value;
        });

        const docId = attrs.id;

        // 🔥 GET ORIGINAL ISSUE TX
        let issueTx = null;

        try {
          const issueOut = await execPromise(
            `pramaand query txs --query "document.registered.doc_id='${docId}'" -o json`
          );

          const parsedIssue = JSON.parse(issueOut).txs || [];
          issueTx = parsedIssue[0]?.txhash || null;
        } catch {}

        results.push({
          id: docId,
          from: attrs.from,
          to: attrs.to,
          transferTx: tx.txhash,
          issueTx,
        });
      }
    }

    return { documents: results };

  } catch (e) {
    return { documents: [] };
  }
};

// 👤 TRANSFER
exports.transferDocument = async ({ id, newOwner, userName }) => {
  const passphrase = "123456789";

  return new Promise((resolve) => {
    const child = spawn("pramaand", [
      "tx",
      "docreg",
      "transfer-document",
      id,
      newOwner,
      "--from",
      userName,
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

    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));

    console.log("📤 TRANSFER OUTPUT STREAM:", output);

    child.stdin.write(passphrase + "\n");
    child.stdin.end();

    child.on("close", (code) => {
      console.log("✅ TRANSFER EXIT CODE:", code);
      console.log("📦 FULL OUTPUT:\n", output);

      if (code !== 0) {
        return resolve({
          success: false,
          error: output,
        });
      }

      resolve({
        success: true,
        result: output,
      });
    });
  });
};