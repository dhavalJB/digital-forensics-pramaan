const express = require("express");
const cors = require("cors");
const { startScanner } = require("./core/scanner");
const { startIndexer } = require("./indexer/scanner");
const path = require("path"); 

// Import Routes
const explorerRoutes = require("./routes/explorer");
const documentRoutes = require("./routes/documents");
const blockRoutes = require("./routes/blocks");
const txRoutes = require("./routes/txs");
const authorityRoutes = require("./routes/authorities");
const validatorRoutes = require("./routes/validators");
const issuerRoutes = require("./routes/issuers");
const userRoutes = require("./routes/users");
const systemRoutes = require("./routes/system");
const verificationRoutes = require("./routes/verification");


// Forensics
const authRoutes = require("./routes/auth");
const caseRoutes = require("./routes/caseRoutes");
const evidenceRoutes = require("./routes/evidenceRoutes");


const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

const CASES_PATH = path.join(__dirname, "cases");
console.log("📂 Serving static files from:", CASES_PATH);

app.use("/files", express.static(CASES_PATH));


// Register All Modules
app.use("/", explorerRoutes);
app.use("/", documentRoutes);
app.use("/", blockRoutes);
app.use("/", txRoutes);
app.use("/", authorityRoutes);
app.use("/", validatorRoutes);
app.use("/", issuerRoutes);
app.use("/", userRoutes);
app.use("/", systemRoutes);
app.use("/", verificationRoutes);

//Forensics 
app.use("/", authRoutes);
app.use("/", caseRoutes);
app.use("/", evidenceRoutes);

// 🔥 Start Background Engines
let SYSTEM_STARTED = false;
async function init() {
  if (SYSTEM_STARTED) return;
  SYSTEM_STARTED = true;
  console.log("🚀 PRAMAAN SYSTEM INITIALIZING...");
  startScanner(); // Basic Sync
  startIndexer(); // Forensic Deep-Scan
}
init();

app.listen(4000, () => {
  console.log("🚀 Pramaan Backend Online: http://localhost:4000");
});