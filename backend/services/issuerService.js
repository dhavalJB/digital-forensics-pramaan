const { execPromise, runCLI } = require("../core/executor");
const { spawn } = require("child_process");
const { fundAddress } = require("../core/provisioner");

const yaml = require("js-yaml");
const crypto = require("crypto");

// 🏢 GET ALL ISSUERS (READ → execPromise OK)
exports.getIssuers = async () => {
  const out = await execPromise(
    "pramaand query issuer issuers"
  );

  const parsed = yaml.load(out);

  return {
    issuers: parsed?.issuers || [],
  };
};

exports.getIssuersByValidator = async (validatorAddress) => {
  try {
    // 1. Get the authorized addresses from State
    const stateOut = await execPromise("pramaand query issuer issuers --output yaml");
    const stateParsed = yaml.load(stateOut);
    const allIssuers = stateParsed?.issuers || [];

    const authorizedAddresses = allIssuers
      .filter(i => i.validator === validatorAddress)
      .map(i => i.address);

    if (authorizedAddresses.length === 0) {
      return { success: true, issuers: [] };
    }

    // 2. 🔥 FIXED COMMAND: Using --query instead of --event
    // We query for transactions where the action matches our issuer creation
    const txSearchOut = await execPromise(
      `pramaand query txs --query "message.action='/pramaan.issuer.v1.MsgCreateIssuer'" --limit 100 --output json`
    );
    
    const txData = JSON.parse(txSearchOut);
    const txs = txData.tx_responses || txData.txs || [];

    // 3. RECONSTRUCT Registry from Memos
    const enrichedIssuers = authorizedAddresses.map(addr => {
      const matchingTx = txs.find(t => {
        const body = t.tx?.body || t.body;
        return JSON.stringify(body.messages).includes(addr);
      });

      let metadata = { moniker: "Department Authority", coordinator: "Authorized Official", email: "N/A" };
      
      const body = matchingTx?.tx?.body || matchingTx?.body;
      if (body && body.memo) {
        try {
          metadata = JSON.parse(body.memo);
        } catch (e) {
          console.log(`⚠️ Memo is plain text for ${addr}`);
        }
      }

      return {
        address: addr,
        validator: validatorAddress,
        domain: "education", 
        moniker: metadata.moniker || "Authority Node",
        coordinator: metadata.coordinator || "Official Head",
        email: metadata.email || "dept@univ.edu",
        active: true,
        txHash: matchingTx?.txhash || "ON-CHAIN"
      };
    });

    return { success: true, issuers: enrichedIssuers };

  } catch (e) {
    console.error("❌ On-Chain Rebuild Error:", e.message);
    return { success: false, issuers: [], error: e.message };
  }
};

exports.createIssuer = async () => {
  const uniqueName = "issuer_" + crypto.randomBytes(4).toString("hex");
  const passphrase = "123456789";

  console.log("📝 Creating Department Issuer:", uniqueName);

  return new Promise((resolve) => {
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

    // 🔐 Inject passphrase
    setTimeout(() => {
      child.stdin.write(passphrase + "\n");
      child.stdin.write(passphrase + "\n");
      child.stdin.end();
    }, 300);

    child.on("close", async (code) => {
      if (code !== 0) {
        console.error("❌ Issuer Creation Failed:", output);
        return resolve({ success: false, error: output });
      }

      // 🔍 Extract Details
      const address = output.match(/address:\s*(\S+)/)?.[1];
      const lines = output.split("\n").map((l) => l.trim()).filter(Boolean);

      let mnemonic = "";
      for (const line of lines) {
        const words = line.split(" ").filter(Boolean);
        if (words.length >= 12 && words.length <= 24) {
          mnemonic = words.join(" ");
        }
      }

   let fundedSuccessfully = false;
      if (address) {
        console.log(`📝 [DEPARTMENT_PROVISION] Funding Issuer: ${address}`);
        fundedSuccessfully = await fundAddress(address); 
      }

      console.log(`✅ Issuer ${uniqueName} created and funded: ${fundedSuccessfully}`);

      resolve({
        success: true,
        name: uniqueName,
        address,
        mnemonic,
        passphrase,
        funded: fundedSuccessfully,
        type: "DEPARTMENT_ISSUER"
      });
    });
  });
};

// 🏢 LOGIN ISSUER (FIXED 🔥)
exports.loginIssuer = async (data) => {
  const { name, passphrase } = data;

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
    {
      passphrase,
    }
  );

  if (!res.success) {
    return {
      success: false,
      error: res.error,
    };
  }

  return {
    success: true,
    address: res.output.trim(),
    name,
  };
};

// 🏢 ADD ISSUER (ON-CHAIN 🔥 FIXED)
exports.addIssuer = async (data) => {
  const {
    validator,
    issuer,
    domain,
    from,
    fees = "1000stake",
  } = data;

  const passphrase = "123456789";

  const res = await runCLI(
    "pramaand",
    [
      "tx",
      "issuer",
      "add-issuer",
      validator,
      issuer,
      domain,
      "--from",
      from,
      "--fees",
      fees,
      "--chain-id",
      "pramaan-edu",
      "--keyring-backend",
      "file",
      "--home",
      "/home/dhaval/edu/.pramaand",
      "-y",
    ],
    {
      passphrase,
    }
  );

  if (!res.success) {
    return {
      success: false,
      error: res.error,
    };
  }

  return {
    success: true,
    result: res.output,
  };
};


exports.getSingleIssuerDetails = async (address) => {
  try {
    // 1. Check if the address is even an authorized issuer in the current State
    const stateOut = await execPromise(`pramaand query issuer get-issuer ${address} --output json`);
    const state = JSON.parse(stateOut);
    
    if (!state || !state.issuer) {
      return { success: false, error: "Address not authorized on L1" };
    }

    // 2. Scan Blockchain history for the specific 'MsgCreateIssuer' that contains this address
    // We search for transactions where this address was the one being created
    const txSearchOut = await execPromise(
      `pramaand query txs --query "message.action='/pramaan.issuer.v1.MsgCreateIssuer' AND create_issuer.address='${address}'" --output json`
    );
    
    const txData = JSON.parse(txSearchOut);
    const txs = txData.tx_responses || txData.txs || [];

    let metadata = { moniker: "Department Office", coordinator: "Official", email: "N/A" };
    let txHash = "ON-CHAIN";

    if (txs.length > 0) {
      const latestTx = txs[0];
      txHash = latestTx.txhash;
      const body = latestTx.tx?.body || latestTx.body;
      
      if (body && body.memo) {
        try {
          metadata = JSON.parse(body.memo);
        } catch (e) {
          console.log(`⚠️ Memo for ${address} is not JSON`);
        }
      }
    }

    // 3. Reconstruct the full profile including the validator link
    return {
      success: true,
      issuer: {
        address: address,
        validator: state.issuer.validator,
        domain: state.issuer.domain,
        moniker: metadata.moniker || "Authority Node",
        coordinator: metadata.coordinator || "HOD",
        email: metadata.email || "N/A",
        txHash: txHash
      }
    };

  } catch (e) {
    console.error("❌ Single Issuer Fetch Error:", e.message);
    return { success: false, error: "Issuer not found or chain error" };
  }
};

exports.getSingleIssuerDetails = async (address) => {
  try {
    // 1. Validate address exists in State
    let state;
    try {
      const stateOut = await execPromise(`pramaand query issuer get-issuer ${address} --output json`);
      state = JSON.parse(stateOut);
    } catch (err) {
      console.log(`⚠️ Issuer ${address} not found in state.`);
      return { success: false, error: "Not an authorized issuer" };
    }
    
    if (!state || !state.issuer) {
      return { success: false, error: "Issuer record empty" };
    }

    // 2. Scan for the specific Creation TX to get the Memo details
    // Added specific check to ensure query finds the right event
    const txSearchOut = await execPromise(
      `pramaand query txs --query "message.action='/pramaan.issuer.v1.MsgCreateIssuer' AND create_issuer.address='${address}'" --output json`
    );
    
    const txData = JSON.parse(txSearchOut || "{}");
    const txs = txData.tx_responses || txData.txs || [];

    let metadata = { moniker: "Department Office", coordinator: "Official Head", email: "N/A" };
    let txHash = "ON-CHAIN";

    if (txs.length > 0) {
      const latestTx = txs[0];
      txHash = latestTx.txhash;
      const body = latestTx.tx?.body || latestTx.body;
      
      if (body && body.memo) {
        try {
          metadata = JSON.parse(body.memo);
        } catch (e) {
          console.log(`⚠️ Memo for ${address} is plain text: ${body.memo}`);
          metadata.moniker = body.memo; // Fallback to raw text
        }
      }
    }

    return {
      success: true,
      issuer: {
        address: address,
        validator: state.issuer.validator,
        domain: state.issuer.domain,
        moniker: metadata.moniker || "Authority Node",
        coordinator: metadata.coordinator || "HOD",
        email: metadata.email || "N/A",
        txHash: txHash
      }
    };

  } catch (e) {
    // 🔥 This is where your 'undefined' was likely coming from
    console.error("❌ Single Issuer Fetch Error:", e.message || e);
    return { success: false, error: e.message || "Internal Protocol Error" };
  }
};