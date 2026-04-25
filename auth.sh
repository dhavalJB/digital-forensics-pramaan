#!/bin/bash
set -e

echo "🏛️  PRAMAAN SOVEREIGN IDENTITY PROVISIONER"
echo "----------------------------------------"

# ---- INPUTS ----
read -p "📍 Enter Recipient Address: " AUTH_ADDR
read -p "🆔 Enter Entity ID: " AUTH_ID
read -p "📛 Enter Display Name: " AUTH_N
read -p "🏢 Enter Full Legal Name: " AUTH_FN
read -p "⚖️  Trust Tier (T1/T2): " AUTH_V
read -p "🌐 Official URL: " AUTH_URL

# ---- FIXED CONFIG ----
HOME_DIR="/app/.pramaand"
CHAIN_ID="pramaan-edu"
KEYRING="test"
TS=$(date +%s)

# ---- CONSTRUCT METADATA ----
METADATA="{\"id\":\"$AUTH_ID\",\"n\":\"$AUTH_N\",\"fn\":\"$AUTH_FN\",\"v\":\"$AUTH_V\",\"url\":\"$AUTH_URL\",\"ts\":$TS}"

# ---- GET MULTISIG ADDRESS ----
MULTISIG_ADDR=$(pramaand keys show root -a --keyring-backend $KEYRING --home $HOME_DIR)

# ---- STEP 1: GENERATE TX ----
pramaand tx authority add-authority \
  --address $AUTH_ADDR \
  --role AUTHORITY \
  --from root \
  --chain-id $CHAIN_ID \
  --fees 1000stake \
  --note "$METADATA" \
  --generate-only \
  --keyring-backend $KEYRING \
  --home $HOME_DIR > tx.json

# ---- STEP 2: SIGN ROOT1 ----
pramaand tx sign tx.json \
  --from root1 \
  --chain-id $CHAIN_ID \
  --multisig $MULTISIG_ADDR \
  --keyring-backend $KEYRING \
  --home $HOME_DIR > tx1.json

# ---- STEP 3: SIGN ROOT2 ----
pramaand tx sign tx.json \
  --from root2 \
  --chain-id $CHAIN_ID \
  --multisig $MULTISIG_ADDR \
  --keyring-backend $KEYRING \
  --home $HOME_DIR > tx2.json

# ---- STEP 4: COMBINE ----
pramaand tx multisign tx.json root tx1.json tx2.json \
  --chain-id $CHAIN_ID \
  --keyring-backend $KEYRING \
  --home $HOME_DIR > tx_final.json

# ---- STEP 5: BROADCAST ----
echo "🚀 Broadcasting Sovereign Authority to L1..."
pramaand tx broadcast tx_final.json --home $HOME_DIR --broadcast-mode sync -y

echo "✅ DONE: Identity Provisioned for $AUTH_N"
