const { execPromise, runCLI } = require("../core/executor");
const { spawn } = require("child_process");
const yaml = require("js-yaml");
const crypto = require("crypto");
const { fundAddress } = require("../core/provisioner");

exports.getValidators = async () => {
  const [vOut, pOut] = await Promise.all([
    execPromise("pramaand query validatorreg validators"),
    execPromise("pramaand query validatorreg proposals"),
  ]);

  const vParsed = yaml.load(vOut);
  const pParsed = yaml.load(pOut);

  const activeAddresses = vParsed.validators || [];
  const proposals = pParsed.proposals || [];

  // We map through ALL proposals and flag those that are truly active on-chain
  const enrichedValidators = proposals.map(p => {
    const addr = p.applicant?.trim();
    return {
      address: addr,
      // 🔥 A node is ONLY 'isLive' if it's in the validators list AND status is ACTIVATED
      isLive: activeAddresses.includes(addr) && p.status === "ACTIVATED"
    };
  });

  return { validators: enrichedValidators };
};

exports.createValidator = async () => {
  const name = "validator_" + crypto.randomBytes(4).toString("hex");
  const passphrase = "123456789";

  console.log("🔥 [SYSTEM] Initiating Validator Genesis:", name);

  return new Promise((resolve) => {
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

    // 🔐 Inject passphrase for file keyring encryption
    setTimeout(() => {
      child.stdin.write(passphrase + "\n");
      child.stdin.write(passphrase + "\n");
      child.stdin.end();
    }, 200);

    child.on("close", async (code) => {
      if (code !== 0) {
        return resolve({ success: false, error: output });
      }

      // 🔍 Parse Ledger Output
      const address = output.match(/address:\s*(\S+)/)?.[1];
      const pubkey = output.match(/pubkey:\s*'([^']+)'/)?.[1];
      const lines = output.split("\n").map((l) => l.trim()).filter(Boolean);

      let mnemonic = "";
      for (const line of lines) {
        const words = line.split(" ").filter(Boolean);
        if (words.length >= 12 && words.length <= 24) {
          mnemonic = words.join(" ");
        }
      }

      // 🔥 AUTO-FUNDING TRIGGER
      let isFunded = false;
      if (address) {
        console.log(`🏦 [SYSTEM] Provisioning L1 Stake for Validator: ${address}...`);
        
        // ✅ CORRECT CALL: Use the name you imported at the top of the file
        try {
          isFunded = await fundAddress(address); 
        } catch (fundErr) {
          console.error("❌ Funding sequence interrupted:", fundErr);
          isFunded = false;
        }
      }

      resolve({
        success: true,
        name,
        address,
        pubkey,
        mnemonic,
        passphrase,
        funded: isFunded,
        raw: output
      });
    });
  });
};

exports.loginValidator = async ({ name, passphrase }) => {
  const res = await runCLI(
    "pramaand",
    [
      "keys",
      "show",
      name,
      "-a",
      "--keyring-backend",
      "file",
      "--home",
      "/home/dhaval/edu/.pramaand",
    ],
    { passphrase }
  );

  if (!res.success) {
    return { success: false, error: res.error };
  }

  return {
    success: true,
    name,
    address: res.output.trim(),
  };
};


exports.applyValidator = async ({ name, domain, data }) => {
  const passphrase = "123456789";

  // Check if data is provided, otherwise send a default or empty string
  const metadataValue = data || "{}";

const res = await runCLI(
    "pramaand",
    [
      "tx",
      "validatorreg",
      "apply-validator",
      "--domain", domain, 
      "--data", metadataValue, 
      "--from", name,
      "--chain-id", "pramaan-edu",
      "--fees", "1000stake",
      "--keyring-backend", "file",
      "--home", "/home/dhaval/edu/.pramaand",
      "-y",
    ],
    { passphrase }
  );

  console.log("📦 APPLY VALIDATOR OUTPUT:\n", res.output);

  if (!res.success) {
    return { success: false, error: res.error };
  }

  return {
    success: true,
    result: res.output,
  };
};

exports.getProposals = async () => {
  const out = await execPromise(
    "pramaand query validatorreg proposals"
  );

  const parsed = yaml.load(out);

  return {
    proposals: parsed?.proposals || [],
  };
};

exports.activateValidator = async ({ name, proposalId }) => {
    const passphrase = "123456789";

    console.log(`🚀 Service: Activating node [${name}] via Proposal ID [${proposalId}]`);

    return new Promise((resolve) => {
        const child = spawn("pramaand", [
            "tx",
            "validatorreg",
            "activate-validator",
            "--proposal-id", // 👈 Added this flag
            proposalId,      // 👈 The value now follows the flag
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

        child.stdout.on("data", (d) => { output += d.toString(); });
        child.stderr.on("data", (d) => { error += d.toString(); });

        // 🔐 Inject Passphrase
        child.stdin.write(passphrase + "\n");
        child.stdin.end();

        child.on("close", (code) => {
            if (code !== 0) {
                console.error("❌ ACTIVATION ERROR:", error);
                return resolve({
                    success: false,
                    error: error.trim() || "CLI Execution Failed",
                });
            }

            console.log("📦 CLI OUTPUT:\n", output);

            // Extract TxHash
            const txHash = output.match(/txhash:\s*(\S+)/)?.[1];

            resolve({
                success: true,
                txHash: txHash,
                result: output,
            });
        });
    });
};

let localIssuerDetails = {};

exports.addIssuer = async (data) => {
  const { validatorName, issuerAddress, domain, metadata, fees = "1000stake" } = data;
  const passphrase = "123456789";
  const noteValue = typeof metadata === 'string' ? metadata : JSON.stringify(metadata || {});

  console.log(`📡 [L1_TX] Provisioning Issuer: ${issuerAddress} via --note`);

  const res = await runCLI(
    "pramaand",
    [
      "tx", "issuer", "create-issuer",
      "--address", issuerAddress,
      "--domain", domain,
      "--from", validatorName,
      "--note", noteValue, 
      "--chain-id", "pramaan-edu",
      "--fees", fees,
      "--keyring-backend", "file",
      "--home", "/home/dhaval/edu/.pramaand",
      "--output", "json", // 🔥 Force JSON output to capture the hash
      "-y",
    ],
    { passphrase }
  );

  if (res.success) {
    try {
      // 🛡️ PARSE THE CLI OUTPUT TO FIND THE HASH
      const txData = JSON.parse(res.output);
      const txHash = txData.txhash;
      
      console.log(`✅ [L1_CONFIRMED] Transaction Successful!`);
      console.log(`🔗 [TX_HASH]: ${txHash}`); // 🔥 THIS WILL NOW PRINT IN PM2 LOGS
      
      // Update local registry
      localIssuerDetails[issuerAddress] = JSON.parse(noteValue);
      
      return { success: true, hash: txHash, result: res.output };
    } catch (e) {
      // Fallback if parsing fails but CLI reported success
      console.log("📦 CLI Raw Output:", res.output);
      return { success: true, result: res.output };
    }
  }

  console.error("❌ [L1_ERROR]:", res.error);
  return { success: false, error: res.error };
};