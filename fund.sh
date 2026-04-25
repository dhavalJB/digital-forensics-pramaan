#!/bin/bash

set -e

echo "🚀 PRAMAAN Auto Funding"

# ---- INPUT (ONLY ADDRESS) ----
read -p "Enter recipient address: " TO_ADDR

# ---- FIXED CONFIG ----
AMOUNT="1000000stake"
HOME_DIR="/app/.pramaand"
CHAIN_ID="pramaan-edu"
KEYRING="test"

# ---- GET MULTISIG ADDRESS ----
MULTISIG_ADDR=$(pramaand keys show root -a --keyring-backend $KEYRING --home $HOME_DIR)

echo "👉 Sending $AMOUNT to $TO_ADDR"

# ---- GENERATE TX ----
pramaand tx bank send \
  $MULTISIG_ADDR \
  $TO_ADDR \
  $AMOUNT \
  --chain-id $CHAIN_ID \
  --fees 1000stake \
  --generate-only \
  --keyring-backend $KEYRING \
  --home $HOME_DIR > tx.json

# ---- SIGN ROOT1 ----
pramaand tx sign tx.json \
  --from root1 \
  --chain-id $CHAIN_ID \
  --multisig $MULTISIG_ADDR \
  --keyring-backend $KEYRING \
  --home $HOME_DIR > tx1.json

# ---- SIGN ROOT2 ----
pramaand tx sign tx.json \
  --from root2 \
  --chain-id $CHAIN_ID \
  --multisig $MULTISIG_ADDR \
  --keyring-backend $KEYRING \
  --home $HOME_DIR > tx2.json

# ---- COMBINE ----
pramaand tx multisign tx.json root tx1.json tx2.json \
  --chain-id $CHAIN_ID \
  --keyring-backend $KEYRING \
  --home $HOME_DIR > tx_final.json

# ---- BROADCAST ----
pramaand tx broadcast tx_final.json --home $HOME_DIR

# ---- WAIT FOR CHAIN ----
echo "⏳ Waiting for transaction confirmation..."
sleep 5

# ---- VERIFY ----
echo "🔍 Balance:"
pramaand query bank balances $TO_ADDR

echo "✅ DONE"
