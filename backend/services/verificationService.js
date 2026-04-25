const { spawn } = require("child_process");
const { execPromise } = require("../core/executor");
const yaml = require("js-yaml");
const crypto = require("crypto");

// 🔥 TEMP MEMORY STORE (replace later with DB / blockchain)
let requests = [];

// 🟢 Create Request
exports.createRequest = async (payload) => {
  const request = {
    ...payload,
    status: "PENDING",
    createdAt: Date.now(),
  };

  requests.push(request);

  console.log("📥 REQUEST STORED:", request.nonce);

  return request;
};

// 🟢 Get Status
exports.getStatus = async (nonce) => {
  const reqItem = requests.find(r => r.nonce === nonce);

  if (!reqItem) {
    return { verified: false, data: null };
  }

  return {
    verified: reqItem.status === "VERIFIED",
    data: reqItem
  };
};

// 🟢 Get Pending for User
exports.getPending = async (address) => {
  return requests.filter(
    r => r.owner === address && r.status === "PENDING"
  );
};

exports.approve = async ({ nonce, owner, note, userName, docId }) => {
  const passphrase = "123456789";

const verificationData = {
  t: "V",
  d: docId,
  n: note.slice(0, 80)
};

  const memo = JSON.stringify(verificationData);

  return new Promise((resolve) => {
    const child = spawn("pramaand", [
      "tx",
      "bank",
      "send",
      owner,
      owner,
      "1stake",
      "--note",
      memo,
      "--from",
      userName, // 🔥 USER KEY
      "--chain-id",
      "pramaan-edu",
      "--fees",
      "1000stake",
      "--keyring-backend",
      "file",
      "--home",
      "/home/dhaval/edu/.pramaand",
      "-y"
    ]);

    let output = "";

    child.stdout.on("data", (d) => (output += d.toString()));
    child.stderr.on("data", (d) => (output += d.toString()));

    child.stdin.write(passphrase + "\n");
    child.stdin.end();

child.on("close", (code) => {
  console.log("EXIT CODE", code);
  console.log("FULL OUTPUT:\n", output);

  if (code === 0) {
    const reqItem = requests.find(r => r.nonce === nonce);

    if (reqItem) {
      reqItem.status = "VERIFIED";
      reqItem.verifiedAt = Date.now();
    }
  }

  if (code !== 0) {
    return resolve({
      success: false,
      error: output
    });
  }

  resolve({
    success: true,
    result: output
  });
});
  });
};

exports.getHistory = async (address) => {
  try {
    const out = await execPromise(
      `pramaand query txs --query "message.sender='${address}'" -o json`
    );

    
    const parsed = JSON.parse(out);
    const txs = parsed.txs || [];
    

    const history = [];

    for (const tx of txs) {
      try {
        const memo = tx.tx.body.memo;

        if (!memo) continue;

        const data = JSON.parse(memo);
        // 🔥 ONLY OUR VERIFY TX
        if (data.t !== "V") continue;

        history.push({
          docId: data.d,
          note: data.n,
          owner: tx.tx.body.messages[0].from_address,
  timestamp: tx.timestamp,

          txhash: tx.txhash
        });

      } catch (e) {
        // ignore invalid memos
      }
    }

    return history.reverse(); // latest first

  } catch (e) {
    console.error("History error:", e);
    return [];
  }
};