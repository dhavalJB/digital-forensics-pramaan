function parseAttributes(event) {
  const attrs = {};
  (event.attributes || []).forEach((a) => {
    attrs[a.key] = a.value;
  });
  return attrs;
}

function parseEvent(event, tx) {
  const attrs = parseAttributes(event);

  // 📄 DOCUMENT ISSUED
  if (event.type === "document.registered") {
    return {
      type: "DOCUMENT_ISSUED",
      from: "GENESIS",
      to: attrs.owner,
      issuer: attrs.issuer,
      domain: attrs.domain,
      docId: attrs.doc_id,
      metadata: attrs.metadata || null,
      txhash: tx.txhash,
      height: Number(attrs.height || tx.height || 0),
      time: attrs.block_time || null,
      category: "document",
    };
  }

  // 🔁 TRANSFER
  if (event.type === "document_transferred") {
    return {
      type: "DOCUMENT_TRANSFERRED",
      from: attrs.from,
      to: attrs.to,
      docId: attrs.id,
      txhash: tx.txhash,
      height: Number(tx.height || 0),
      category: "document",
    };
  }

  // 👑 AUTHORITY
  if (event.type === "authority.created") {
    return {
      type: "AUTHORITY_CREATED",
      address: attrs.address,
      role: attrs.role,
      category: "governance",
    };
  }

  // 🧑‍⚖️ VALIDATOR
  if (event.type === "validator.proposal.created") {
    return {
      type: "VALIDATOR_PROPOSAL",
      applicant: attrs.applicant,
      domain: attrs.domain,
      category: "governance",
    };
  }

  if (event.type === "validator.proposal.approved") {
    return {
      type: "VALIDATOR_APPROVED",
      approver: attrs.approver,
      category: "governance",
    };
  }

  if (event.type === "validator.activated") {
    return {
      type: "VALIDATOR_ACTIVATED",
      validator: attrs.validator,
      domain: attrs.domain,
      category: "governance",
    };
  }

  // 🏢 ISSUER
  if (event.type === "issuer_added") {
    return {
      type: "ISSUER_ADDED",
      address: attrs.address,
      domain: attrs.domain,
      category: "issuer",
    };
  }

  if (event.type === "issuer_revoked") {
    return {
      type: "ISSUER_REVOKED",
      address: attrs.address,
      category: "issuer",
    };
  }

  return null;
}

module.exports = {
  parseEvent,
};