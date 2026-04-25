const { spawn } = require("child_process");
const crypto = require("crypto");
const { execPromise } = require("../core/executor");
const { fundAddress } = require("../core/provisioner");

const HOME = "/home/dhaval/digital-forensics/.pramaand";
const KEYRING = "file";

exports.signup = async () => {
  const name = "user_" + crypto.randomBytes(4).toString("hex");
  const passphrase = "123456789";

  return new Promise((resolve) => {
    const child = spawn("pramaand", [
      "keys",
      "add",
      name,
      "--keyring-backend",
      KEYRING,
      "--home",
      HOME,
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
      if (code !== 0) {
        return resolve({ success: false, error: output });
      }

      const address = output.match(/address:\s*(\S+)/)?.[1];

      // extract mnemonic
      const lines = output.split("\n").map((l) => l.trim());
      let mnemonic = "";
      for (const line of lines) {
        const words = line.split(" ").filter(Boolean);
        if (words.length >= 12 && words.length <= 24) {
          mnemonic = words.join(" ");
        }
      }

      // fund
      let funded = false;
      if (address) {
        funded = await fundAddress(address);
      }

      const roles = await detectRoles(address);

      resolve({
        success: true,
        name,
        address,
        mnemonic,
        passphrase,
        funded,
        roles,
      });
    });
  });
};

exports.login = async ({ name, passphrase }) => {
  return new Promise((resolve) => {
    const child = spawn("pramaand", [
      "keys",
      "show",
      name,
      "-a",
      "--keyring-backend",
      KEYRING,
      "--home",
      HOME,
    ]);

    let output = "";

    child.stdout.on("data", (d) => (output += d.toString()));
    child.stdin.write(passphrase + "\n");
    child.stdin.end();

    child.on("close", async (code) => {
      if (code !== 0) {
        return resolve({
          success: false,
          error: "Invalid credentials",
        });
      }

      const address = output.trim();
      const roles = await detectRoles(address);

      resolve({
        success: true,
        name,
        address,
        roles,
      });
    });
  });
};

async function detectRoles(address) {
  const roles = ["USER"];

  try {
    const issuers = await execPromise(
      `pramaand query issuer issuers --home ${HOME}`
    );

    if (issuers.includes(address)) {
      roles.push("ISSUER");
    }
  } catch {}

  return roles;
}

exports.getIssuerProfile = async (address) => {
  try {
    const res = await execPromise(
      `pramaand query txs --query "message.action='/pramaan.issuer.v1.MsgCreateIssuer'" --limit 50 --home /home/dhaval/digital-forensics/.pramaand --output json`
    );

    const data = JSON.parse(res);

    if (!data.txs) return { exists: false };

    for (const tx of data.txs.reverse()) {
      const events = tx.events || [];

      const match = events.find((e) => {
        if (e.type !== "issuer_added") return false;

        return e.attributes?.some(
          (a) => a.key === "address" && a.value === address
        );
      });

      if (match) {
        const memo = tx?.tx?.body?.memo;

        if (!memo) continue;

        let metadata = {};
        try {
          metadata = JSON.parse(memo);
        } catch {}

        return {
          exists: true,
          address,
          ...metadata,
        };
      }
    }

    return { exists: false };
  } catch (err) {
    console.error(err);
    return { exists: false };
  }
};