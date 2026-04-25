const express = require("express");
const cors = require("cors");
const { spawn, exec } = require("child_process");
const yaml = require("js-yaml");
const crypto = require("crypto");


const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/documents", (req, res) => {
  const { owner, issuer, type, status } = req.query;

  exec(
    "pramaand query docreg query-documents",
    (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: stderr });
      }

      try {
        const yaml = require("js-yaml");
        const parsed = yaml.load(stdout);

        let docs = parsed.documents || [];

        // 🔥 APPLY FILTERS (UNCHANGED)
        if (owner) {
          docs = docs.filter((d) =>
            d.owner?.toLowerCase().includes(owner.toLowerCase())
          );
        }

        if (issuer) {
          docs = docs.filter((d) =>
            d.issuer?.toLowerCase().includes(issuer.toLowerCase())
          );
        }

        if (type) {
          docs = docs.filter((d) =>
            (d.type || d.doc_type || "")
              .toLowerCase()
              .includes(type.toLowerCase())
          );
        }

        if (status) {
          docs = docs.filter((d) =>
            (d.status || "issued")
              .toLowerCase()
              .includes(status.toLowerCase())
          );
        }

        // 🔥 NORMALIZATION LAYER (IMPORTANT)
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
            hash: d.hash,
            created_at: d.created_at || null,
            txhash: null,
    height: null  
          };
        });

        res.json({ documents: normalized });
      } catch (e) {
        res.status(500).json({
          error: "Parse error",
          raw: stdout,
        });
      }
    }
  );
});

app.get("/verify/:id", (req, res) => {
  const { id } = req.params;

  exec(
    "pramaand query docreg query-documents",
    (error, stdout) => {
      if (error || !stdout) {
        return res.json({
          valid: false,
          error: "Query failed",
        });
      }

      try {
        const yaml = require("js-yaml");
        const parsed = yaml.load(stdout);

        const docs = parsed.documents || [];

        // 🔥 FIND DOCUMENT
        const doc = docs.find((d) => d.id === id);

        if (!doc) {
          return res.json({
            valid: false,
            error: "Document not found",
          });
        }

        // 🔥 PARSE METADATA (same logic as /documents)
        let metadata = {};
        try {
          metadata =
            typeof doc.metadata === "string"
              ? JSON.parse(doc.metadata)
              : doc.metadata || {};
        } catch { }

        // 🔥 FETCH TX HASH
        exec(
          `pramaand query txs --query "document.registered.doc_id='${id}'" -o json`,
          (txErr, txOut) => {
            let txhash = null;

            try {
              const txParsed = JSON.parse(txOut);
              const tx = txParsed.txs?.[0];
              if (tx) txhash = tx.txhash;
            } catch { }

            return res.json({
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
            });
          }
        );
      } catch (e) {
        return res.json({
          valid: false,
          error: "Parse error",
        });
      }
    }
  );
});

app.get("/tx/:hash", (req, res) => {
  const { hash } = req.params;

  const cmd = `pramaand query tx ${hash} -o json`;

  exec(cmd, (err, stdout) => {
    if (err) {
      console.log("TX ERROR:", err);
      return res.json({ success: false });
    }

    try {
      const parsed = JSON.parse(stdout);

      const tx = parsed.tx_response || parsed;

      const height = tx.height;
      const events = [];

      // 🔥 HANDLE BOTH STRUCTURES
      const allEvents = [];

      if (tx.logs) {
        tx.logs.forEach((log) => {
          (log.events || []).forEach((e) => allEvents.push(e));
        });
      }

      if (tx.events) {
        tx.events.forEach((e) => allEvents.push(e));
      }

      // 🔥 PARSE EVENTS
      allEvents.forEach((event) => {
        const attrs = {};

        (event.attributes || []).forEach((a) => {
          attrs[a.key] = a.value;
        });

        // ✅ DOCUMENT ISSUED
if (event.type === "document.registered") {
  let title = "Document Issued";
  let category = "document";

  // 🔥 DOMAIN INTELLIGENCE
  if (attrs.domain === "education") {
    title = "🎓 Education Certificate Issued";
    category = "education";
  }

  if (attrs.domain === "land_property") {
    title = "🏠 Property Registered";
    category = "property";
  }

  events.push({
    type: "DOCUMENT_ISSUED",
    title,
    category,

    from: "GOVERMENT",
    to: attrs.owner,
    issuer: attrs.issuer,
    domain: attrs.domain,
    docId: attrs.doc_id,

    // 🔥 IMPORTANT (future UI use)
    metadata: attrs.metadata || null,
  });
}

        // ✅ TRANSFER
        if (event.type === "document_transferred") {
          events.push({
            type: "DOCUMENT_TRANSFERRED",
            from: attrs.from,
            to: attrs.to,
            docId: attrs.id,
          });
        }

        // ✅ AUTHORITY
        if (event.type === "authority.created") {
          events.push({
            type: "AUTHORITY_CREATED",
            address: attrs.address,
            role: attrs.role,
          });
        }

        // ✅ ISSUER
        if (event.type === "issuer_added") {
          events.push({
            type: "ISSUER_ADDED",
            address: attrs.address,
            domain: attrs.domain,
          });
        }

        if (event.type === "issuer_revoked") {
          events.push({
            type: "ISSUER_REVOKED",
            address: attrs.address,
          });
        }

        // ✅ VALIDATOR FLOW
        if (event.type === "validator.proposal.created") {
          events.push({
            type: "VALIDATOR_PROPOSAL",
            applicant: attrs.applicant,
            domain: attrs.domain,
          });
        }

        if (event.type === "validator.proposal.approved") {
          events.push({
            type: "VALIDATOR_APPROVED",
            approver: attrs.approver,
          });
        }

        if (event.type === "validator.activated") {
          events.push({
            type: "VALIDATOR_ACTIVATED",
            validator: attrs.validator,
            domain: attrs.domain,
          });
        }
      });

      res.json({
        success: true,
        hash,
        height,
        events,
      });

    } catch (e) {
      console.log("TX PARSE ERROR:", stdout);
      res.json({ success: false });
    }
  });
});

app.get("/txhash/:id", (req, res) => {
  const { id } = req.params;

  const query = `pramaand query txs --query "document.registered.doc_id='${id}'" -o json`;

  exec(query, (err, stdout, stderr) => {
    if (err || !stdout) {
      return res.json({
        success: false,
        error: "Tx not found",
      });
    }

    try {
      const parsed = JSON.parse(stdout);

      // ✅ FIX HERE
      const tx = parsed.txs?.[0];

      if (!tx) {
        return res.json({
          success: false,
          error: "No transaction found",
        });
      }

      res.json({
        success: true,
        txhash: tx.txhash,
      });
    } catch (e) {
      res.json({
        success: false,
        error: "Parse error",
      });
    }
  });
});

app.get("/txs/recent", async (req, res) => {
  try {
    const limit = Number(req.query.limit || 10);

    // 🔥 GET LATEST BLOCK
    const statusOut = await execPromise("pramaand status");
    const parsed = JSON.parse(statusOut);

    let height = Number(parsed?.sync_info?.latest_block_height || 0);

    const txs = [];
    let scanned = 0;

    const MAX_SCAN = 50;

    // 🔥 AUTO SCAN BACKWARD
    while (txs.length < limit && scanned < MAX_SCAN) {
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

    res.json({ txs });

  } catch (e) {
    console.log("RECENT TX SCAN ERROR:", e);
    res.json({ txs: [] });
  }
});

app.get("/authorities", (req, res) => {
  exec("pramaand query authority authorities", (err, stdout) => {
    if (err) return res.status(500).json({ error: err });

    const parsed = require("js-yaml").load(stdout);
    res.json({ authorities: parsed.authorities || [] });
  });
});

app.get("/validators", (req, res) => {
  exec("pramaand query validatorreg validators", (err1, vOut) => {
    if (err1) return res.status(500).json({ error: err1 });

    exec("pramaand query validatorreg proposals", (err2, pOut) => {
      if (err2) return res.status(500).json({ error: err2 });

      const yaml = require("js-yaml");

      const vParsed = yaml.load(vOut);
      const pParsed = yaml.load(pOut);

      const validators = vParsed.validators || [];
      const proposals = pParsed.proposals || [];

      const TOTAL_AUTHORITIES = 3;

      // ✅ ACTIVE VALIDATORS (with proposal mapping)
      const enriched = validators.map((addr) => {
        const proposal = proposals.find(
          (p) => p.applicant?.trim() === addr.trim()
        );

        if (!proposal) {
          return {
            id: null, // ✅ no proposal
            address: addr,
            domain: "unknown",
            status: "ACTIVE",
            approvals: {
              count: TOTAL_AUTHORITIES,
              total: TOTAL_AUTHORITIES,
              by: [],
            },
          };
        }

        const approvals = proposal.approvals || [];

        return {
          id: proposal.id, // ✅ correct
          address: addr,
          domain: proposal.domain,
          status: proposal.status,
          approvals: {
            count: approvals.length,
            total: TOTAL_AUTHORITIES,
            by: approvals,
          },
        };
      });

      // ✅ PENDING / NOT YET ACTIVE
      const pendingOnly = proposals
        .filter((p) => !validators.includes(p.applicant))
        .map((p) => {
          const approvals = p.approvals || [];

          return {
            id: p.id, // ✅ FIXED
            address: p.applicant,
            domain: p.domain,
            status: p.status,
            approvals: {
              count: approvals.length,
              total: TOTAL_AUTHORITIES,
              by: approvals,
            },
          };
        });

      res.json({
        validators: [...enriched, ...pendingOnly],
      });
    });
  });
});

app.get("/stats", async (req, res) => {
  try {
    const [docs, issuers, validators] = await Promise.all([
      execPromise("pramaand query docreg query-documents"),
      execPromise("pramaand query issuer issuers"),
      execPromise("pramaand query validatorreg validators"),
    ]);

    res.json({
      documents: yaml.load(docs)?.documents?.length || 0,
      issuers: yaml.load(issuers)?.issuers?.length || 0,
      validators: yaml.load(validators)?.validators?.length || 0,
    });
  } catch (e) {
    res.status(500).json({ error: "Stats failed" });
  }
});

function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

app.get("/proposals", (req, res) => {
  exec("pramaand query validatorreg proposals", (err, stdout) => {
    if (err) return res.status(500).json({ error: err });

    const parsed = require("js-yaml").load(stdout);
    res.json({ proposals: parsed.proposals || [] });
  });
});

app.post("/authority/create", (req, res) => {
  const name = "auth_" + crypto.randomBytes(4).toString("hex");
  const passphrase = "123456789";

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

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: output });
    }

    const address = output.match(/address:\s*(\S+)/)?.[1];

    const lines = output.split("\n").map(l => l.trim()).filter(Boolean);
    const mnemonicLine = lines.find(line => {
      const words = line.split(" ");
      return (
        (words.length === 12 || words.length === 24) &&
        words.every(w => /^[a-z]+$/.test(w))
      );
    });

    res.json({
      success: true,
      name,
      address,
      mnemonic: mnemonicLine || "",
      passphrase
    });
  });
});

app.post("/authority/login", (req, res) => {
  const { name, passphrase } = req.body;

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
    if (code !== 0) {
      return res.status(401).json({ success: false });
    }

    res.json({
      success: true,
      name,
      address: output.trim(),
    });
  });
});

app.post("/authority/approve", (req, res) => {
  const { name, proposalId } = req.body;
  const passphrase = "123456789"; // same as create

  console.log("🧠 Authority approving:", name, "Proposal:", proposalId);

  const child = spawn("pramaand", [
    "tx",
    "validatorreg",
    "approve-validator",
    "--proposal-id",
    proposalId,
    "--from",
    name,
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

  // 🔐 send passphrase
  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    console.log("APPROVE OUTPUT:", output);
    console.log("APPROVE ERROR:", error);

    if (code !== 0) {
      return res.status(500).json({
        success: false,
        error: error || output,
      });
    }

    res.json({
      success: true,
      result: output,
    });
  });
});

app.post("/validator/create", (req, res) => {
  const name = "validator_" + crypto.randomBytes(4).toString("hex");
  const passphrase = "123456789";

  console.log("🔥 Creating validator:", name);

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

  child.stdout.on("data", (d) => {
    output += d.toString();
  });

  child.stderr.on("data", (d) => {
    output += d.toString();
  });

  // 🔐 inject passphrase TWICE
  setTimeout(() => {
    child.stdin.write(passphrase + "\n");
    child.stdin.write(passphrase + "\n");
    child.stdin.end();
  }, 200);

  child.on("close", (code) => {
    if (code !== 0) {
      console.error("❌ CREATE ERROR FULL OUTPUT:\n", output);
      return res.status(500).json({ error: output });
    }

    const address = output.match(/address:\s*(\S+)/)?.[1];
    const pubkey = output.match(/pubkey:\s*'([^']+)'/)?.[1];
    const lines = output
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const mnemonicLine = lines.find((line) => {
      const words = line.split(" ");
      return (
        (words.length === 12 || words.length === 24) &&
        words.every((w) => /^[a-z]+$/.test(w))
      );
    });

    const mnemonic = mnemonicLine || "";

    res.json({
      success: true,
      name,
      address,
      pubkey,
      mnemonic,
      passphrase, // ⚠️ return for testing
      raw: output,
    });
  });
});

app.post("/validator/login", (req, res) => {
  const { name, passphrase } = req.body;

  console.log("🔐 Login attempt:", name);

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
  let error = "";

  child.stdout.on("data", (d) => (output += d.toString()));
  child.stderr.on("data", (d) => (error += d.toString()));

  // 🔐 send passphrase immediately (NO waiting)
  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    console.log("LOGIN OUTPUT:", output);
    console.log("LOGIN ERROR:", error);

    if (code !== 0) {
      return res.status(401).json({
        success: false,
        error: error || "Login failed",
      });
    }

    res.json({
      success: true,
      name,
      address: output.trim(),
    });
  });
});

app.post("/validator/apply", (req, res) => {
  const { name, domain } = req.body;
  const passphrase = "123456789"; // same as create

  console.log("🚀 Applying validator:", name);

  const child = spawn("pramaand", [
    "tx",
    "validatorreg",
    "apply-validator",
    "--domain",
    domain,
    "--data",
    JSON.stringify({ name }),
    "--from",
    name,
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

  // 🔐 send passphrase
  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    console.log("APPLY OUTPUT:", output);
    console.log("APPLY ERROR:", error);

    if (code !== 0) {
      return res.status(500).json({
        success: false,
        error: error || output,
      });
    }

    res.json({
      success: true,
      result: output,
    });
  });
});

app.post("/validator/activate", (req, res) => {
  const { name, proposalId } = req.body;
  const passphrase = "123456789";

  console.log("🚀 Activating validator:", name, "Proposal:", proposalId);

  const child = spawn("pramaand", [
    "tx",
    "validatorreg",
    "activate-validator",
    "--proposal-id",
    proposalId,
    "--from",
    name,
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

  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    console.log("ACTIVATE OUTPUT:", output);
    console.log("ACTIVATE ERROR:", error);

    if (code !== 0) {
      return res.status(500).json({
        success: false,
        error: error || output,
      });
    }

    res.json({
      success: true,
      result: output,
    });
  });
});

app.post("/validator/add-issuer", (req, res) => {
  const { validatorName, issuerAddress, domain } = req.body;
  const passphrase = "123456789";

  console.log("🏛️ Validator adding issuer:", issuerAddress);

  const child = spawn("pramaand", [
    "tx",
    "issuer",
    "create-issuer",
    "--address",
    issuerAddress,
    "--domain",
    domain,
    "--from",
    validatorName,
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

  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    console.log("ADD ISSUER OUTPUT:", output);

    if (error && error.trim()) {
      console.log("⚠️ STDERR:", error);
    }

    const isSuccess = output.includes("code: 0");

    if (!isSuccess) {
      return res.status(500).json({
        success: false,
        error: error || output,
      });
    }

    res.json({
      success: true,
      result: output,
    });
  });
});

app.post("/validator/revoke-issuer", (req, res) => {
  const { validatorName, issuerAddress } = req.body;
  const passphrase = "123456789";

  console.log("🚫 Revoking issuer:", issuerAddress);

  const child = spawn("pramaand", [
    "tx",
    "issuer",
    "revoke-issuer",
    "--address",
    issuerAddress,
    "--from",
    validatorName,
    "--chain-id",
    "pramaan-edu",
    "--fees",
    "1000stake",
    "--keyring-backend",
    "file", // ✅ SAME AS ADD
    "--home",
    "/home/dhaval/edu/.pramaand", // ✅ SAME AS ADD
    "-y",
  ]);

  let output = "";
  let error = "";

  child.stdout.on("data", (d) => (output += d.toString()));
  child.stderr.on("data", (d) => (error += d.toString()));

  // 🔐 passphrase required
  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    console.log("REVOKE OUTPUT:", output);

    if (error && error.trim()) {
      console.log("⚠️ STDERR:", error);
    }

    const isSuccess = output.includes("code: 0");

    if (!isSuccess) {
      return res.status(500).json({
        success: false,
        error: error || output,
      });
    }

    res.json({
      success: true,
      result: output,
    });
  });
});

app.post("/issuer/create", (req, res) => {
  const uniqueName =
    "issuer_" + crypto.randomBytes(4).toString("hex");

  const passphrase = "123456789";

  const child = spawn("pramaand", [
    "keys",
    "add",
    uniqueName,
    "--keyring-backend",
    "file",
    "--home",
    "/home/dhaval/edu/.pramaand",
  ]);

  let output = "";

  child.stdout.on("data", (d) => (output += d.toString()));
  child.stderr.on("data", (d) => (output += d.toString()));

  // 🔐 inject passphrase twice
  setTimeout(() => {
    child.stdin.write(passphrase + "\n");
    child.stdin.write(passphrase + "\n");
    child.stdin.end();
  }, 200);

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: output });
    }

    const address = output.match(/address:\s*(\S+)/)?.[1];

    const lines = output.split("\n").map(l => l.trim()).filter(Boolean);
    const mnemonicLine = lines.find(line => {
      const words = line.split(" ");
      return (
        (words.length === 12 || words.length === 24) &&
        words.every(w => /^[a-z]+$/.test(w))
      );
    });

    res.json({
      success: true,
      name: uniqueName,
      address,
      mnemonic: mnemonicLine || "",
      passphrase
    });
  });
});

app.post("/issuer/login", (req, res) => {
  const { name, passphrase } = req.body;

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
  let error = "";

  child.stdout.on("data", (d) => (output += d.toString()));
  child.stderr.on("data", (d) => (error += d.toString()));

  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(401).json({ error: error || "Login failed" });
    }

    res.json({
      success: true,
      address: output.trim(),
      name,
    });
  });
});

app.post("/issuer/add", (req, res) => {
  const { validatorName, issuerAddress, domain } = req.body;
  const passphrase = "123456789";

  const child = spawn("pramaand", [
    "tx",
    "issuer",
    "create-issuer",
    "--address",
    issuerAddress,
    "--domain",
    domain,
    "--from",
    validatorName,
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

  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        success: false,
        error: error || output,
      });
    }

    res.json({
      success: true,
      result: output,
    });
  });
});

app.get("/issuers", (req, res) => {
  exec(
    "pramaand query issuer issuers --output json",
    (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: stderr,
        });
      }

      try {
        const parsed = JSON.parse(stdout);

        const issuers = (parsed.issuers || []).map((i) => ({
          address: i.address,
          domain: i.domain,
          validator: i.validator,
          active: i.active,
        }));

        res.json({ issuers });
      } catch (e) {
        res.status(500).json({
          success: false,
          error: "Parsing failed",
        });
      }
    }
  );
});

app.get("/issuers/:validator", (req, res) => {
  const { validator } = req.params;

  exec("pramaand query issuer issuers", (err, stdout) => {
    if (err) return res.status(500).json({ error: err });

    const parsed = require("js-yaml").load(stdout);
    const issuers = parsed.issuers || [];

    const filtered = issuers.filter(
      (i) => i.validator === validator
    );

    res.json({ issuers: filtered });
  });
});

app.post("/issuer/docreg", (req, res) => {
  const { id, owner, metadata, type, issuerName, issuerAddress } = req.body;
  const passphrase = "123456789";

  console.log("📄 Register doc:", id);

  const crypto = require("crypto");

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(metadata))
    .digest("hex");

  const child = spawn("pramaand", [
    "tx",
    "docreg",
    "register-document",
    id,
    hash,
    owner,
    issuerAddress,
    type,
    JSON.stringify(metadata),
    "--from",
    issuerName,
    "--chain-id",
    "pramaan-edu",
    "--fees",
    "1000stake",
    "--gas",
    "200000",
    "--node",
    "http://localhost:26657",
    "--keyring-backend",
    "file",
    "--home",
    "/home/dhaval/edu/.pramaand",
    "-y",
  ]);

  let output = "";
  let error = "";

  child.stdout.on("data", (d) => {
    console.log("📤", d.toString());
    output += d.toString();
  });

  child.stderr.on("data", (d) => {
    const msg = d.toString();
    console.log("⚠", msg);
    error += msg;
  });

  // 🔥 FORCE PASSPHRASE (IMPORTANT)
  setTimeout(() => {
    console.log("🔐 Sending passphrase...");
    child.stdin.write(passphrase + "\n");
    child.stdin.end();
  }, 300);

  child.on("close", () => {
    const isSuccess = output.includes("code: 0");

    if (!isSuccess) {
      return res.status(500).json({
        success: false,
        error: error || output,
      });
    }

    res.json({ success: true });
  });
});

app.post("/document/transfer", (req, res) => {
  const { id, newOwner, issuerName } = req.body;
  const passphrase = "123456789";

  console.log("🔁 Transfer doc:", id, "→", newOwner);

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

  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    console.log("TRANSFER OUTPUT:", output);
    console.log("TRANSFER ERROR:", error);

    if (code !== 0) {
      return res.status(500).json({
        success: false,
        error: error || output,
      });
    }

    res.json({
      success: true,
      result: output,
    });
  });
});

app.post("/users/create", (req, res) => {
  const crypto = require("crypto");

  const name = "user_" + crypto.randomBytes(4).toString("hex");
  const passphrase = "123456789";

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

  // 🔐 inject passphrase twice
  setTimeout(() => {
    child.stdin.write(passphrase + "\n");
    child.stdin.write(passphrase + "\n");
    child.stdin.end();
  }, 200);

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: output });
    }

    const address = output.match(/address:\s*(\S+)/)?.[1];

    const lines = output.split("\n").map(l => l.trim()).filter(Boolean);

    const mnemonicLine = lines.find(line => {
      const words = line.split(" ");
      return (
        (words.length === 12 || words.length === 24) &&
        words.every(w => /^[a-z]+$/.test(w))
      );
    });

    res.json({
      success: true,
      name,
      address,
      mnemonic: mnemonicLine || "",
      passphrase
    });
  });
});

app.post("/users/login", (req, res) => {
  const { name, passphrase } = req.body;

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
  let error = "";

  child.stdout.on("data", (d) => (output += d.toString()));
  child.stderr.on("data", (d) => (error += d.toString()));

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    res.json({
      success: true,
      name,
      address: output.trim(),
    });
  });

  child.stdin.write(passphrase + "\n");
  child.stdin.end();
});

app.get("/users/documents/:address", (req, res) => {
  const { address } = req.params;

  exec("pramaand query docreg query-documents", (error, stdout) => {
    if (error) {
      return res.status(500).json({ error: "Query failed" });
    }

    try {
      const yaml = require("js-yaml");
      const parsed = yaml.load(stdout);

      let docs = parsed.documents || [];

      // ✅ FILTER BY OWNER
      docs = docs.filter((d) => d.owner === address);

      // 🔥 SAME NORMALIZATION AS /documents
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

          // 🔥 FIX DOMAIN CONSISTENCY
          domain:
            d.domain ||
            d.doc_type ||
            d.type ||
            "education",

          metadata: meta,

          transferable: d.transferable ?? false,
        };
      });

      res.json({ documents: normalized });
    } catch (e) {
      res.status(500).json({ error: "Parse error" });
    }
  });
});

app.post("/users/transfer", (req, res) => {
  const { id, newOwner, userName } = req.body;
  const passphrase = "123456789";

  console.log("👤 User transfer:", id, "→", newOwner);

  const child = spawn("pramaand", [
    "tx",
    "docreg",
    "transfer-document",
    id,
    newOwner,
    "--from",
    userName, // 🔥 OWNER SIGNING
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

  child.stdin.write(passphrase + "\n");
  child.stdin.end();

  child.on("close", (code) => {
    console.log("USER TRANSFER OUTPUT:", output);
    console.log("USER TRANSFER ERROR:", error);

    if (code !== 0) {
      return res.status(500).json({
        success: false,
        error: error || output,
      });
    }

    res.json({
      success: true,
      result: output,
    });
  });
});

app.get("/users/previously-owned/:address", (req, res) => {
  const { address } = req.params;

  const transferQuery = `pramaand query txs --query "document_transferred.from='${address}'" -o json`;

  exec(transferQuery, (err, out) => {
    if (err) return res.json({ documents: [] });

    try {
      const txs = JSON.parse(out).txs || [];
      const results = [];

      const processTransfers = async () => {
        for (const tx of txs) {
          for (const event of tx.events || []) {

            if (event.type !== "document_transferred") continue;

            const attrs = {};
            (event.attributes || []).forEach((a) => {
              attrs[a.key] = a.value;
            });

            const docId = attrs.id;

            // 🔥 FETCH ISSUE TX FOR SAME DOC
            const issueQuery = `pramaand query txs --query "document.registered.doc_id='${docId}'" -o json`;

            const issueTx = await new Promise((resolve) => {
              exec(issueQuery, (e, o) => {
                try {
                  const parsed = JSON.parse(o).txs || [];
                  resolve(parsed[0]?.txhash || null);
                } catch {
                  resolve(null);
                }
              });
            });

            results.push({
              id: docId,
              from: attrs.from,
              to: attrs.to,
              transferTx: tx.txhash,
              issueTx: issueTx,
            });
          }
        }

        res.json({ documents: results });
      };

      processTransfers();

    } catch {
      res.json({ documents: [] });
    }
  });
});

app.get("/documents/full-history/:id", (req, res) => {
  const { id } = req.params;

  const issueQuery = `pramaand query txs --query "document.registered.doc_id='${id}'" -o json`;
  const transferQuery = `pramaand query txs --query "document_transferred.id='${id}'" -o json`;

  const parseTxs = (out) => {
    try {
      return JSON.parse(out).txs || [];
    } catch {
      return [];
    }
  };

  const parseEvents = (tx) => {
    const results = [];

    (tx.events || []).forEach((event) => {
      const attrs = {};

      event.attributes.forEach((a) => {
        attrs[a.key] = a.value;
      });

      // ✅ ISSUE EVENT
      if (event.type === "document.registered") {
        results.push({
          type: "ISSUED",
          from: attrs.issuer || "UNKNOWN",
          to: attrs.owner,
          issuer: attrs.issuer,
          domain: attrs.domain,
          txhash: tx.txhash,
          height: Number(attrs.height || tx.height || 0),
          timestamp: attrs.block_time || null,
        });
      }

      // ✅ TRANSFER EVENT
      if (event.type === "document_transferred") {
        results.push({
          type: "TRANSFER",
          from: attrs.from,
          to: attrs.to,
          txhash: tx.txhash,
          height: Number(tx.height || 0),
        });
      }
    });

    return results;
  };

  exec(issueQuery, (e1, out1) => {
    exec(transferQuery, (e2, out2) => {

      const issueTxs = parseTxs(out1);
      const transferTxs = parseTxs(out2);

      let timeline = [];

      // 🔥 PARSE ALL EVENTS
      issueTxs.forEach((tx) => {
        timeline.push(...parseEvents(tx));
      });

      transferTxs.forEach((tx) => {
        timeline.push(...parseEvents(tx));
      });

      // 🔥 REMOVE DUPLICATES (by txhash)
      const unique = Array.from(
        new Map(timeline.map((t) => [t.txhash, t])).values()
      );

      // 🔥 SORT BY BLOCK HEIGHT
      unique.sort((a, b) => a.height - b.height);

      return res.json({
        id,
        timeline: unique,
      });
    });
  });
});

app.get("/events/recent", (req, res) => {
const query = `pramaand query txs --query "tx.height>0" --limit 50 -o json`;

  exec(query, (err, out) => {
    if (err) return res.json({ events: [] });

    try {
      const txs = JSON.parse(out).txs || [];
      let events = [];

      txs.forEach((tx) => {
        (tx.events || []).forEach((event) => {
          const attrs = {};

          (event.attributes || []).forEach((a) => {
            attrs[a.key] = a.value;
          });

          let parsedEvent = null;

          // 📄 DOCUMENT ISSUED
          if (event.type === "document.registered") {
            parsedEvent = {
              type: "DOCUMENT_ISSUED",
              title: "Document Issued",
              description: `Issued to ${attrs.owner}`,
              txhash: tx.txhash,
              height: Number(attrs.height || tx.height || 0),
              time: attrs.block_time || null,
              category: "document",
            };
          }

          // 🔁 TRANSFER
          if (event.type === "document_transferred") {
            parsedEvent = {
              type: "TRANSFER",
              title: "Ownership Transferred",
              description: `${attrs.from} → ${attrs.to}`,
              txhash: tx.txhash,
              height: Number(tx.height || 0),
              category: "document",
            };
          }

          // 👑 AUTHORITY
          if (event.type === "authority.created") {
            parsedEvent = {
              type: "AUTHORITY_CREATED",
              title: "Authority Created",
              description: `${attrs.address}`,
              category: "governance",
            };
          }

          // 🏛 VALIDATOR PROPOSAL
          if (event.type === "validator.proposal.created") {
            parsedEvent = {
              type: "VALIDATOR_PROPOSAL",
              title: "Validator Proposal",
              description: `${attrs.applicant}`,
              category: "governance",
            };
          }

          // ✅ APPROVAL
          if (event.type === "validator.proposal.approved") {
            parsedEvent = {
              type: "VALIDATOR_APPROVED",
              title: "Validator Approved",
              description: `By ${attrs.approver}`,
              category: "governance",
            };
          }

          // ⚡ ACTIVATED
          if (event.type === "validator.activated") {
            parsedEvent = {
              type: "VALIDATOR_ACTIVATED",
              title: "Validator Activated",
              description: `${attrs.validator}`,
              category: "governance",
            };
          }

          // 🏢 ISSUER ADDED
          if (event.type === "issuer_added") {
            parsedEvent = {
              type: "ISSUER_ADDED",
              title: "Issuer Added",
              description: `${attrs.address}`,
              category: "issuer",
            };
          }

          // 🚫 ISSUER REVOKED
          if (event.type === "issuer_revoked") {
            parsedEvent = {
              type: "ISSUER_REVOKED",
              title: "Issuer Revoked",
              description: `${attrs.address}`,
              category: "issuer",
            };
          }

          if (parsedEvent) {
            events.push(parsedEvent);
          }
        });
      });

      // 🔥 SORT LATEST FIRST
      events.sort((a, b) => (b.height || 0) - (a.height || 0));

      res.json({ events });

    } catch {
      res.json({ events: [] });
    }
  });
});

let LIVE_EVENTS = [];
let LAST_HEIGHT = 0;

async function startLiveEventScanner() {
  console.log("🚀 LIVE EVENT SCANNER STARTED");

  while (true) {
    try {
      const statusOut = await execPromise("pramaand status");
      const parsed = JSON.parse(statusOut);

      const latest = Number(
        parsed?.sync_info?.latest_block_height || 0
      );

      // 🔥 FIRST INIT
      if (!LAST_HEIGHT) {
        LAST_HEIGHT = latest;
        console.log("⚡ Initial height set:", LAST_HEIGHT);
      }

      // 🔥 ONLY NEW BLOCKS (NO PAST SCAN)
      if (latest > LAST_HEIGHT) {
        for (let h = LAST_HEIGHT + 1; h <= latest; h++) {
          try {
            const txsOut = await execPromise(
              `pramaand query txs --query "tx.height=${h}" -o json`
            );

            const parsedTx = JSON.parse(txsOut);
            const txs = parsedTx.txs || [];

            if (txs.length === 0) {
              continue;
            }

            for (const tx of txs) {
              try {
                const txDetailOut = await execPromise(
                  `pramaand query tx ${tx.txhash} -o json`
                );

                const txDetail = JSON.parse(txDetailOut);
                const txResp = txDetail.tx_response || txDetail;

                const allEvents = [];

                // logs.events
                if (txResp.logs) {
                  txResp.logs.forEach(log => {
                    (log.events || []).forEach(e => allEvents.push(e));
                  });
                }

                // direct events
                if (txResp.events) {
                  txResp.events.forEach(e => allEvents.push(e));
                }

                // 🔥 PARSE EVENTS
                allEvents.forEach(event => {
                  const attrs = {};

                  (event.attributes || []).forEach(a => {
                    attrs[a.key] = a.value;
                  });

                  let parsedEvent = null;

                  // 📄 DOCUMENT
                  if (event.type === "document.registered") {
                    parsedEvent = {
                      type: "DOCUMENT_ISSUED",
                      doc_id: attrs.doc_id,
                      from: attrs.issuer,
                      to: attrs.owner,
                      domain: attrs.domain,
                      txhash: tx.txhash,
                      height: Number(attrs.height || h),
                      time: attrs.block_time || null,
                    };
                  }

                  // 🔁 TRANSFER
                  if (event.type === "document_transferred") {
                    parsedEvent = {
                      type: "TRANSFER",
                      doc_id: attrs.id,
                      from: attrs.from,
                      to: attrs.to,
                      txhash: tx.txhash,
                      height: Number(attrs.height || h),
                    };
                  }

                  // 🏛 AUTHORITY
                  if (event.type === "authority.created") {
                    parsedEvent = {
                      type: "AUTHORITY_CREATED",
                      address: attrs.address,
                      role: attrs.role,
                      txhash: tx.txhash,
                      height: Number(attrs.height || h),
                    };
                  }

                  // ⚡ VALIDATOR
                  if (event.type === "validator.activated") {
                    parsedEvent = {
                      type: "VALIDATOR_ACTIVATED",
                      validator: attrs.validator,
                      domain: attrs.domain,
                      txhash: tx.txhash,
                      height: Number(attrs.height || h),
                    };
                  }

                  // 🏢 ISSUER
                  if (event.type === "issuer_added") {
                    parsedEvent = {
                      type: "ISSUER_ADDED",
                      address: attrs.address,
                      domain: attrs.domain,
                      txhash: tx.txhash,
                      height: Number(attrs.height || h),
                    };
                  }

                  if (parsedEvent) {
                    // 🔥 PRINT IN TERMINAL
                    console.log("🔥 LIVE EVENT:", parsedEvent);

                    // 🔥 STORE (LATEST FIRST)
                    LIVE_EVENTS.unshift(parsedEvent);

                    // 🔥 LIMIT MEMORY
                    if (LIVE_EVENTS.length > 200) {
                      LIVE_EVENTS.pop();
                    }
                  }
                });

              } catch (e) {
                console.log("TX ERROR:", tx.txhash);
              }
            }

          } catch (e) {
            console.log("BLOCK ERROR:", h);
          }
        }

        LAST_HEIGHT = latest;
      }

    } catch (e) {
      console.log("STATUS ERROR:", e);
    }

    // 🔥 CHECK EVERY 2 SEC
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function bootstrapLastHeight() {
  console.log("⚡ BOOTSTRAP START");

  try {
    const statusOut = await execPromise("pramaand status");
    const parsed = JSON.parse(statusOut);

    let height = Number(parsed?.sync_info?.latest_block_height || 0);

    const MAX_SCAN = 50;

    for (let i = 0; i < MAX_SCAN; i++) {
      try {
        const txsOut = await execPromise(
          `pramaand query txs --query "tx.height=${height}" -o json`
        );

        const parsedTx = JSON.parse(txsOut);
        const txs = parsedTx.txs || [];

        if (txs.length > 0) {
          console.log("✅ FOUND TX BLOCK:", height);

          LAST_HEIGHT = height;
          return;
        }

      } catch {}

      height--;
    }

    // fallback
    LAST_HEIGHT = height;

  } catch (e) {
    console.log("BOOTSTRAP ERROR:", e);
    LAST_HEIGHT = 0;
  }

  console.log("⚡ BOOTSTRAP DONE →", LAST_HEIGHT);
}

app.get("/events", (req, res) => {
  const limit = Number(req.query.limit || 20);

  res.json({
    events: LIVE_EVENTS.slice(0, limit),
  });
});

async function startSystem() {
  await bootstrapLastHeight();   // 🔥 FIRST
  startLiveEventScanner();       // 🔥 THEN LIVE
}

startSystem();

app.get("/blocks/recent", (req, res) => {
    console.log("🔥 HIT /blocks/recent");

  const limit = Number(req.query.limit || 10);


  exec("pramaand status", (err, stdout) => {
    if (err) {
      console.log("STATUS ERROR:", err);
      return res.json({ blocks: [] });
    }

    try {
      const parsed = JSON.parse(stdout);

      const latest = Number(parsed?.sync_info?.latest_block_height || 0);

      if (!latest) {
        return res.json({ blocks: [] });
      }

      const blocks = [];

      for (let i = 0; i < limit; i++) {
        blocks.push({ height: latest - i });
      }

      res.json({ blocks });

    } catch (e) {
      console.log("PARSE ERROR:", stdout);
      res.json({ blocks: [] });
    }
  });
});

app.get("/blocks/latest", (req, res) => {
  exec("pramaand status", (err, stdout) => {
    if (err) return res.json({ height: 0 });

    try {
      const parsed = JSON.parse(stdout);

      const height =
        parsed?.sync_info?.latest_block_height || 0;

      res.json({
        height: Number(height),
      });

    } catch (e) {
      console.log("STATUS PARSE ERROR:", stdout);
      res.json({ height: 0 });
    }
  });
});

app.get("/blocks/:height/txs", (req, res) => {
  const { height } = req.params;

const query = `pramaand query txs --query "tx.height=${height}" --limit 100 -o json`;
  exec(query, (err, stdout) => {
    if (err) {
      console.log("TX FETCH ERROR:", err);
      return res.json({ txs: [] });
    }

    try {
      const parsed = JSON.parse(stdout);
      const txs = parsed.txs || [];

      // 🔥 NORMALIZE
      const result = txs.map((tx) => ({
        hash: tx.txhash,
        height: tx.height,
      }));

      res.json({ txs: result });

    } catch (e) {
      console.log("TX PARSE ERROR:", stdout);
      res.json({ txs: [] });
    }
  });
});

app.get("/blocks/:height", (req, res) => {
  const { height } = req.params;

  const cmd = `pramaand query block --type=height ${height} -o json`;

  exec(cmd, (err, stdout) => {
    if (err) return res.json({ success: false });

    try {
      const block = JSON.parse(stdout);

      res.json({
        success: true,
        block,
      });
    } catch {
      res.json({ success: false });
    }
  });
});

const util = require("util");

app.get("/explorer/overview", async (req, res) => {
  try {
    // -------------------------------
    // 🔥 1. GET LATEST BLOCK
    // -------------------------------
    const statusOut = await execPromise("pramaand status");
    const parsedStatus = JSON.parse(statusOut);

    const latest = Number(
      parsedStatus?.sync_info?.latest_block_height || 0
    );

    // -------------------------------
    // 🔥 2. RECENT BLOCKS (FOR UI)
    // -------------------------------
    const blocks = [];
    for (let i = 0; i < 10; i++) {
      blocks.push({ height: latest - i });
    }

    // -------------------------------
    // 🔥 3. AUTO SCAN ENGINE
    // -------------------------------
    const events = [];
    let totalTxs = 0;

    let height = latest;
    let scanned = 0;

    const MAX_SCAN = 50;      // safety
    const TARGET_EVENTS = 20;  // UI requirement

    while (events.length < TARGET_EVENTS && scanned < MAX_SCAN) {
      try {
        const txsOut = await execPromise(
          `pramaand query txs --query "tx.height=${height}" -o json`
        );

        const parsed = JSON.parse(txsOut);
        const txs = parsed.txs || [];

        totalTxs += txs.length;

        for (const tx of txs) {
          try {
            const txDetailOut = await execPromise(
              `pramaand query tx ${tx.txhash} -o json`
            );

            const txDetail = JSON.parse(txDetailOut);
            const txResp = txDetail.tx_response || txDetail;

            const allEvents = [];

            // logs.events
            if (txResp.logs) {
              txResp.logs.forEach(log => {
                (log.events || []).forEach(e => allEvents.push(e));
              });
            }

            // global events
            if (txResp.events) {
              txResp.events.forEach(e => allEvents.push(e));
            }

            // -------------------------------
            // 🔥 EVENT PARSER
            // -------------------------------
            allEvents.forEach(event => {
              const attrs = {};

              (event.attributes || []).forEach(a => {
                attrs[a.key] = a.value;
              });

              // 📄 DOCUMENT ISSUED
              if (event.type === "document.registered") {
                let title = "📄 Document Issued";
                let category = "document";

                if (attrs.domain === "education") {
                  title = "🎓 Education Certificate";
                  category = "education";
                }

                if (attrs.domain === "land_property") {
                  title = "🏠 Property Registered";
                  category = "property";
                }

                events.push({
                  type: "DOCUMENT_ISSUED",
                  title,
                  category,
                  description: `Issued to ${attrs.owner}`,
                  txhash: tx.txhash,
                  height,
                  time: attrs.block_time || null,
                });
              }

              // 🔁 TRANSFER
              if (event.type === "document_transferred") {
                events.push({
                  type: "DOCUMENT_TRANSFERRED",
                  title: "🔁 Ownership Transferred",
                  description: `${attrs.from} → ${attrs.to}`,
                  txhash: tx.txhash,
                  height,
                  category: "document",
                });
              }

              // 🏛 AUTHORITY
              if (event.type === "authority.created") {
                events.push({
                  type: "AUTHORITY_CREATED",
                  title: "Authority Created",
                  description: attrs.address,
                  category: "governance",
                });
              }

              // 🧑‍⚖️ VALIDATOR
              if (event.type === "validator.activated") {
                events.push({
                  type: "VALIDATOR_ACTIVATED",
                  title: "Validator Activated",
                  description: attrs.validator,
                  category: "governance",
                });
              }

              // 🏢 ISSUER
              if (event.type === "issuer_added") {
                events.push({
                  type: "ISSUER_ADDED",
                  title: "Issuer Added",
                  description: attrs.address,
                  category: "issuer",
                });
              }
            });

          } catch (e) {
            console.log("TX DETAIL FAILED:", tx.txhash);
          }
        }

      } catch (e) {
        // silently skip empty blocks
      }

      height--;
      scanned++;
    }

    // -------------------------------
    // 🔥 SORT EVENTS (LATEST FIRST)
    // -------------------------------
    events.sort((a, b) => b.height - a.height);

    // -------------------------------
    // 🔥 STATS
    // -------------------------------
    const stats = {
      totalTxs,
      documents: events.filter(e => e.type === "DOCUMENT_ISSUED").length,
      transfers: events.filter(e => e.type === "DOCUMENT_TRANSFERRED").length,
      validators: events.filter(e => e.type === "VALIDATOR_ACTIVATED").length,
    };

    // -------------------------------
    // 🔥 FINAL RESPONSE
    // -------------------------------
    res.json({
      latestBlock: latest,
      blocks,
      events: events.slice(0, TARGET_EVENTS),
      stats,
    });

  } catch (e) {
    console.log("OVERVIEW ERROR:", e);
    res.json({ success: false });
  }
});

app.get("/blocks", (req, res) => {
  const limit = Number(req.query.limit || 10);

  exec("pramaand status", (err, stdout) => {
    const latest = JSON.parse(stdout)?.sync_info?.latest_block_height;

    const blocks = [];
    for (let i = 0; i < limit; i++) {
      blocks.push({ height: latest - i });
    }

    res.json({ blocks });
  });
});

app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});

