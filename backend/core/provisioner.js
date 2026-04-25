const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

/**
 * Handles single or multiple funding requests without blocking the main thread.
 */
exports.fundAddress = async (targetAddress) => {
  const CONTAINER = "pramaan-root";

  // If the targetAddress is an array, we fund them all in parallel
  if (Array.isArray(targetAddress)) {
    console.log(`🌊 [BATCH_FUND] Launching parallel funding for ${targetAddress.length} addresses...`);
    return Promise.all(targetAddress.map(addr => exports.fundAddress(addr)));
  }

  try {
    console.log(`📡 [DOCKER_SCRIPT] Triggering fund.sh for: ${targetAddress}`);

    const cmd = `docker exec ${CONTAINER} /bin/bash -c "cd /app && ./fund.sh <<< '${targetAddress}'"`;

    // 🔥 Using non-blocking execPromise
    const { stdout } = await execPromise(cmd);

    console.log(`------- OUTPUT [${targetAddress.substring(0, 12)}...] -------`);
    console.log(stdout);
    console.log("---------------------------------------------------------");

    return true;
  } catch (e) {
    console.error(`❌ Funder Script Error for ${targetAddress}:`, e.stderr || e.message);
    return false;
  }
};