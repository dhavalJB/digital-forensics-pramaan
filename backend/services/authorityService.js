const { spawn } = require("child_process");
const { execPromise } = require("../core/executor");
const yaml = require("js-yaml");
const crypto = require("crypto");
const { fundAddress } = require("../core/provisioner");

// 👑 GET AUTHORITIES
exports.getAuthorities = async () => {
  const out = await execPromise(
    "pramaand query authority authorities"
  );

  const parsed = yaml.load(out);

  return {
    authorities: parsed?.authorities || [],
  };
};

// 👑 CREATE AUTHORITY
exports.createAuthority = async () => {
  const name = "auth_" + crypto.randomBytes(4).toString("hex");
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
        console.log(`🏦 [SYSTEM] Provisioning initial credits for ${address}...`);
        isFunded = await fundAddress(address, "100000stake");
      }

      resolve({
        success: true,
        name,
        address,
        mnemonic,
        passphrase,
        funded: isFunded // Notify frontend if multisig succeeded
      });
    });
  });
};

// 👑 LOGIN AUTHORITY
exports.loginAuthority = async ({ name, passphrase }) => {
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
      if (code !== 0) {
        return reject("Login failed");
      }

      resolve({
        success: true,
        name,
        address: output.trim(),
      });
    });
  });
};

// 👑 APPROVE VALIDATOR
exports.approveValidator = async ({ name, proposalId }) => {
  const passphrase = "123456789";

  return new Promise((resolve, reject) => {
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

    child.stdin.write(passphrase + "\n");
    child.stdin.end();

child.on("close", (code) => {
  console.log("---- CLI OUTPUT ----");
  console.log(output);
  console.log("---- CLI ERROR ----");
  console.log(error);
  console.log("--------------------");

  if (code !== 0) {
    return reject(error || output);
  }

  resolve({
    success: true,
    result: output,
  });
});
  });
};

exports.getAuthorityDetails = async (address) => {
  try {
    // 1. Get basic authority info from state
    const out = await execPromise(
      `pramaand query authority authority --address ${address} --home /home/dhaval/.pramaand --output json`
    );
    const parsedState = JSON.parse(out);
    
    if (!parsedState || !parsedState.authority) {
        throw new Error("Authority not found in blockchain state");
    }

    let identityMetadata = {};

    // 2. Fetch the Identity Packet from the Transaction Memo
    try {
        const txSearchRaw = await execPromise(
            `pramaand query txs --query "authority.created.address='${address}'" --home /home/dhaval/.pramaand --output json`
        );
        
        const txData = JSON.parse(txSearchRaw);
        
        // Match the structure from your terminal output: txs[0].tx.body.memo
        if (txData.txs && txData.txs.length > 0) {
            const memoString = txData.txs[0].tx?.body?.memo;
            
            if (memoString) {
                try {
                    identityMetadata = JSON.parse(memoString);
                    console.log(`✅ Identity Verified for ${address}:`, identityMetadata.n);
                } catch (e) {
                    identityMetadata = { raw: memoString };
                }
            }
        }
    } catch (txErr) {
        console.warn("⚠️ Transaction index search failed, using basic state info.");
    }

    return {
      success: true,
      address: parsedState.authority.address,
      role: parsedState.authority.role,
      identity: identityMetadata // This now returns your MoE India object!
    };
  } catch (err) {
    throw new Error(`On-chain identity lookup failed: ${err.message || String(err)}`);
  }
};