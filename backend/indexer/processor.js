const memory = require("../state/memory");

// 🔒 SAFE JSON PARSE
function safeParse(meta) {
  try {
    return typeof meta === "string" ? JSON.parse(meta) : meta || {};
  } catch {
    return {};
  }
}

exports.processEvent = (event, tx, height) => {
  const attrs = {};
  (event.attributes || []).forEach((a) => {
    attrs[a.key] = a.value;
  });

  let parsedEvent = null;

  // =============================
  // 📄 DOCUMENT ISSUED
  // =============================
  if (event.type === "document.registered") {
    const docId = attrs.doc_id;

    const metadata = safeParse(attrs.metadata);

    memory.upsertDoc(docId, {
      id: docId,
      owner: attrs.owner,
      issuer: attrs.issuer,
      domain: attrs.domain,
      metadata,
      createdAt: attrs.block_time,
      lastTx: tx.txhash,
    });

    memory.addAddressActivity(attrs.owner, {
      type: "RECEIVED",
      docId,
      txhash: tx.txhash,
      height,
    });

    parsedEvent = {
      type: "DOCUMENT_ISSUED",
      docId,
      owner: attrs.owner,
      issuer: attrs.issuer,
      txhash: tx.txhash,
      height,
      category: "document",
    };

    memory.setStats({
      ...memory.getStats(),
      documents: memory.getStats().documents + 1,
    });
  }

  // =============================
  // 🔁 TRANSFER
  // =============================
  if (event.type === "document_transferred") {
    const docId = attrs.id;

    memory.upsertDoc(docId, {
      owner: attrs.to,
      lastTx: tx.txhash,
    });

    memory.addAddressActivity(attrs.from, {
      type: "SENT",
      docId,
      txhash: tx.txhash,
      height,
    });

    memory.addAddressActivity(attrs.to, {
      type: "RECEIVED",
      docId,
      txhash: tx.txhash,
      height,
    });

    parsedEvent = {
      type: "DOCUMENT_TRANSFERRED",
      docId,
      from: attrs.from,
      to: attrs.to,
      txhash: tx.txhash,
      height,
      category: "document",
    };

    memory.setStats({
      ...memory.getStats(),
      transfers: memory.getStats().transfers + 1,
    });
  }

  // =============================
  // 🏛 AUTHORITY
  // =============================
  if (event.type === "authority.created") {
    parsedEvent = {
      type: "AUTHORITY_CREATED",
      address: attrs.address,
      role: attrs.role,
      category: "governance",
    };
  }

  // =============================
  // ⚡ VALIDATOR
  // =============================
  if (event.type === "validator.activated") {
    parsedEvent = {
      type: "VALIDATOR_ACTIVATED",
      validator: attrs.validator,
      domain: attrs.domain,
      category: "governance",
    };

    memory.setStats({
      ...memory.getStats(),
      validators: memory.getStats().validators + 1,
    });
  }

  // =============================
  // 🏢 ISSUER
  // =============================
  if (event.type === "issuer_added") {
    parsedEvent = {
      type: "ISSUER_ADDED",
      address: attrs.address,
      domain: attrs.domain,
      category: "issuer",
    };
  }

  // =============================
  // 🔥 STORE GLOBAL EVENTS
  // =============================
  if (parsedEvent) {
    const events = memory.getEvents();

    events.unshift(parsedEvent);

    if (events.length > 200) {
      events.pop();
    }

    memory.setEvents(events);
  }
};