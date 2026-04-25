const { exec, spawn } = require("child_process");

// ✅ EXISTING (KEEP — for NON-interactive commands)
function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return reject(stderr || err.message);
      }
      resolve(stdout);
    });
  });
}

// ✅ NEW (ADD — for blockchain / interactive CLI)
function runCLI(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args);

    let output = "";
    let error = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      error += data.toString();
    });

    // 🔥 CRITICAL FIX — DELAY INPUT
    setTimeout(() => {
      if (options.passphrase) {
        child.stdin.write(options.passphrase + "\n");

        if (options.repeat) {
          child.stdin.write(options.passphrase + "\n");
        }
      }

      child.stdin.end();
    }, 500); // 🔥 IMPORTANT (not 0 or 100)

    child.on("close", (code) => {
      if (code !== 0) {
        return resolve({
          success: false,
          error: error || output,
        });
      }

      resolve({
        success: true,
        output,
      });
    });
  });
}

module.exports = {
  execPromise, // ✅ keep for queries
  runCLI,      // ✅ use for tx / keys / login
};