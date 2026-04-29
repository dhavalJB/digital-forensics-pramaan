"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "@/app/context/SessionContext";

export default function EvidenceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const eid = params.eid as string;

  const { session } = useSession();

  const [profile, setProfile] = useState<any>(null);
  const [evidence, setEvidence] = useState<any>(null);
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");

  const role = profile?.role;

  useEffect(() => {
    if (!id || !eid || !session?.address) return;

    fetch(`http://localhost:4000/case/${id}/evidence/${eid}`)
      .then((res) => res.json())
      .then((data) => setEvidence(data.evidence))
      .catch(console.error);

    fetch(`http://localhost:4000/profile/${session.address}`)
      .then((res) => res.json())
      .then((data) => setProfile(data.profile))
      .catch(console.error);
  }, [id, eid, session]);

  const handleTransfer = async () => {
    if (!to) return alert("Enter receiver address");
    if (role === "ANALYST" && !summary) {
      return alert("Summary is required for Analyst transfer");
    }

    try {
      const res = await fetch("http://localhost:4000/evidence/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: id,
          evidence_id: eid,
          from: session.address,
          to,
          keyName: session.name,
          report: role === "ANALYST" ? { summary, notes } : undefined,
        })
      });

      const data = await res.json();
      if (data.success) {
        alert("Transfer Initiated: Waiting for Recipient Signature");
        window.location.reload();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Transfer failed");
    }
  };

  const handleAccept = async () => {
    try {
      const res = await fetch("http://localhost:4000/evidence/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          case_id: id,
          evidence_id: eid,
          by: session.address,
          keyName: session.name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Custody Accepted: Chain Updated");
        window.location.reload();
      } else {
        alert(data.error || "Failed to accept");
      }
    } catch (err) {
      alert("Error accepting evidence");
    }
  };

  if (!evidence) return (
    <div className="h-full flex items-center justify-center font-mono text-slate-400 animate-pulse uppercase tracking-[0.2em]">
      Decrypting_Asset_Protocol...
    </div>
  );

  const isOwner = evidence?.ownership?.current_owner === session?.address;
  const isPending = !!evidence?.ownership?.pending_owner;
  const isIncoming = evidence?.ownership?.pending_owner === session?.address;
  const isOutgoing = evidence?.ownership?.pending_owner && isOwner;
  const fileUrl = `http://localhost:4000/files/${id}/files/${evidence.file_name}`;

  function EvidenceViewer({ evidence, fileUrl }: any) {
    switch (evidence.category) {
      case "IMAGE":
        return <ImageViewer src={fileUrl} />;

      case "VIDEO":
        return <VideoViewer src={fileUrl} />;

      case "AUDIO":
        return <AudioViewer src={fileUrl} />;

      case "DOCUMENT":
        return <DocumentViewer src={fileUrl} />;

      default:
        return <div className="text-gray-400">Unsupported format</div>;
    }
  }

  function ImageViewer({ src }: any) {
    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const start = useRef({ x: 0, y: 0 });

    const zoom = (delta: number) => {
      setScale((s) => Math.min(Math.max(s + delta, 1), 6));
    };

    const onWheel = (e: any) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 0.2 : -0.2);
    };

    const onDown = (e: any) => {
      setDragging(true);
      start.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      };
    };

    const onMove = (e: any) => {
      if (!dragging) return;
      setPos({
        x: e.clientX - start.current.x,
        y: e.clientY - start.current.y,
      });
    };

    const stop = () => setDragging(false);

    const reset = () => {
      setScale(1);
      setPos({ x: 0, y: 0 });
    };

    const fullscreen = () => {
      const el = document.getElementById("img-viewer");
      el?.requestFullscreen();
    };

    return (
      <div
        id="img-viewer"
        className="relative bg-black rounded-lg overflow-hidden"
      >
        {/* Controls */}
        <div className="absolute top-2 right-2 z-10 flex gap-2 text-xs">
          <button onClick={() => zoom(0.2)}>+</button>
          <button onClick={() => zoom(-0.2)}>-</button>
          <button onClick={reset}>Reset</button>
          <button onClick={fullscreen}>⛶</button>
        </div>

        <div
          className="h-[450px] flex items-center justify-center cursor-grab active:cursor-grabbing"
          onWheel={onWheel}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={stop}
          onMouseLeave={stop}
        >
          <img
            src={src}
            draggable={false}
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              height: "100%",   // ✅ fill height
              width: "auto",    // ✅ maintain aspect
            }}
          />
        </div>
      </div>
    );
  }

  function VideoViewer({ src }: any) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const [scale, setScale] = useState(1);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const start = useRef({ x: 0, y: 0 });

    const zoom = (delta: number) => {
      setScale((s) => Math.min(Math.max(s + delta, 1), 5));
    };

    const onWheel = (e: any) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 0.2 : -0.2);
    };

    const onDown = (e: any) => {
      setDragging(true);
      start.current = {
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      };
    };

    const onMove = (e: any) => {
      if (!dragging) return;
      setPos({
        x: e.clientX - start.current.x,
        y: e.clientY - start.current.y,
      });
    };

    const stop = () => setDragging(false);

    const reset = () => {
      setScale(1);
      setPos({ x: 0, y: 0 });
    };

    const skip = (sec: number) => {
      if (videoRef.current) videoRef.current.currentTime += sec;
    };

    const fullscreen = () => {
      const el = document.getElementById("video-viewer");
      el?.requestFullscreen();
    };

    return (
      <div
        id="video-viewer"
        className="relative bg-black rounded-lg overflow-hidden"
      >
        {/* Controls */}
        <div className="absolute top-2 right-2 z-10 flex gap-2 text-xs">
          <button onClick={() => zoom(0.2)}>+</button>
          <button onClick={() => zoom(-0.2)}>-</button>
          <button onClick={reset}>Reset</button>
          <button onClick={fullscreen}>⛶</button>
        </div>

        {/* Viewer */}
        <div
          className="h-[450px] flex items-center justify-center cursor-grab active:cursor-grabbing"
          onWheel={onWheel}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={stop}
          onMouseLeave={stop}
        >
          <video
            ref={videoRef}
            controls
            className="pointer-events-auto"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              height: "100%",     // ✅ same fix as image
              width: "auto",
            }}
          >
            <source src={src} />
          </video>
        </div>

        {/* Timeline controls */}
        <div className="flex gap-2 mt-2 text-xs px-2 pb-2">
          <button onClick={() => skip(-5)}>⏪ -5s</button>
          <button onClick={() => skip(5)}>⏩ +5s</button>
        </div>
      </div>
    );
  }

  function AudioViewer({ src }: any) {
    const audioRef = useRef<HTMLAudioElement>(null);

    const speed = (rate: number) => {
      if (audioRef.current) audioRef.current.playbackRate = rate;
    };

    return (
      <div className="bg-slate-900 p-4 rounded-lg">

        <audio ref={audioRef} controls className="w-full">
          <source src={src} />
        </audio>

        <div className="flex gap-2 mt-3 text-xs">
          <button onClick={() => speed(1)}>1x</button>
          <button onClick={() => speed(1.5)}>1.5x</button>
          <button onClick={() => speed(2)}>2x</button>
        </div>
      </div>
    );
  }

  function DocumentViewer({ src }: any) {
    const isPDF = src.toLowerCase().includes(".pdf");
    const [scale, setScale] = useState(1);

    const zoom = (delta: number) => {
      setScale((s) => Math.min(Math.max(s + delta, 0.5), 3));
    };

    return (
      <div className="w-full flex flex-col gap-3">

        {/* Controls */}
        <div className="flex justify-end gap-2 text-xs">
          <button onClick={() => zoom(0.2)} className="px-2 py-1 bg-slate-200 rounded">+</button>
          <button onClick={() => zoom(-0.2)} className="px-2 py-1 bg-slate-200 rounded">-</button>
          <button onClick={() => setScale(1)} className="px-2 py-1 bg-slate-200 rounded">Reset</button>
        </div>

        {/* Viewer */}
        {isPDF ? (
          <div className="w-full h-[500px] overflow-auto bg-slate-900 rounded border">

            {/* inner wrapper for scaling */}
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: `${100 / scale}%`, // ✅ keeps layout correct while scaling
              }}
            >
              <iframe
                src={src}
                className="w-full h-[500px] border-0"
              />
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <a
              href={src}
              target="_blank"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-bold"
            >
              Open Document
            </a>
          </div>
        )}

        {/* Download */}
        <a
          href={src}
          download
          className="text-xs text-gray-400 underline text-center"
        >
          Download Original
        </a>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden flex flex-col gap-6 p-2 bg-[#F8FAFC]">

      {/* HEADER: ASSET IDENTITY */}
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-5 px-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 font-black uppercase rounded tracking-tighter">Forensic Object</span>
            <span className="text-[10px] font-mono text-slate-500 font-bold">UID: {evidence.evidence_id}</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">
            Digital Evidence Analysis
          </h1>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${isIncoming ? 'bg-amber-100 text-amber-700 border-amber-300 animate-pulse' : 'bg-slate-100 text-slate-600 border-slate-300'
            }`}>
            {isIncoming ? 'Incoming Transfer' : 'Secure Vault Mode'}
          </span>
        </div>
      </div>

      {/* CORE GRID */}
      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">

        {/* LEFT: PREVIEW & TECHNICAL SPECS */}
        <div className="col-span-7 flex flex-col gap-5 overflow-hidden">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl flex-1 flex items-center justify-center relative border-4 border-slate-800">
            <div className="w-full h-[380px] flex items-center justify-center rounded-lg overflow-hidden bg-slate-800/40">
              <EvidenceViewer evidence={evidence} fileUrl={fileUrl} />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-2 gap-4 text-xs font-bold shadow-sm">
            <div className="space-y-3">
              <div><span className="text-[9px] text-slate-400 block uppercase">Object ID</span> <span className="font-mono text-blue-600">{evidence.evidence_id}</span></div>
              <div><span className="text-[9px] text-slate-400 block uppercase">File Identifier</span> <span className="text-slate-900">{evidence.file_name}</span></div>
              <div><span className="text-[9px] text-slate-400 block uppercase">Metadata Size</span> <span className="text-slate-900">{(evidence.size / 1024).toFixed(2)} KB</span></div>
            </div>
            <div className="space-y-3 border-l pl-4">
              <div><span className="text-[9px] text-slate-400 block uppercase">Capture Node</span> <span className="text-slate-900">{evidence.collected_by}</span></div>
              <div><span className="text-[9px] text-slate-400 block uppercase">Collection Time</span> <span className="text-slate-900 font-mono tracking-tighter">{new Date(evidence.collected_at).toLocaleString()}</span></div>
              <div><span className="text-[9px] text-slate-400 block uppercase">Geo-Marker</span> <span className="text-slate-900 font-mono italic">{evidence.location?.lat}, {evidence.location?.lng}</span></div>
            </div>
          </div>
        </div>

        {/* RIGHT: CRYPTO INTEGRITY & ACTIONS */}
        <div className="col-span-5 flex flex-col gap-5 overflow-y-auto custom-scrollbar pr-2 pb-6">

          {/* INTEGRITY / BLOCKCHAIN BLOCK */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Cryptographic Hash</h2>
              <div className="bg-slate-50 p-3 rounded font-mono text-[10px] break-all border border-slate-100 text-slate-600 leading-relaxed shadow-inner">
                {evidence.hash}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ledger Status</h2>
              {evidence.chain_proof ? (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <div className="text-emerald-700 font-black text-xs uppercase flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Blockchain Anchored
                  </div>
                  <div className="mt-3 space-y-2 font-mono text-[9px] text-emerald-800">
                    <div className="flex justify-between"><span>TX:</span> <span className="break-all text-right max-w-[200px]">{evidence.chain_proof.tx_hash}</span></div>
                    <div className="flex justify-between"><span>BLOCK:</span> <span>{evidence.chain_proof.block_height}</span></div>
                    <div className="flex justify-between"><span>TIMESTAMP:</span> <span>{new Date(evidence.chain_proof.timestamp).toLocaleString()}</span></div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-700 font-black text-[10px] uppercase text-center">
                  Awaiting Consensus Anchor...
                </div>
              )}
            </div>
          </div>

          {/* ACTION CENTER (Transfer / Accept) */}
          <div className="space-y-4">

            {/* INCOMING ACTION */}
            {isIncoming && (
              <div className="bg-emerald-600 text-white rounded-xl p-6 shadow-xl border-b-4 border-emerald-800">
                <h3 className="text-xs font-black uppercase tracking-widest mb-2">Custody Transfer Received</h3>
                <p className="text-[11px] text-emerald-100 mb-4 italic">Confirm the authenticity of the asset before accepting custody into your node.</p>
                <button onClick={handleAccept} className="w-full bg-slate-900 text-white font-black uppercase text-[11px] py-3 rounded-lg shadow-2xl hover:bg-black transition-all">
                  Sign & Accept Custody
                </button>
              </div>
            )}

            {/* TRANSFER ACTION (Only for current owner) */}
            {isOwner && !isPending && (
              <div className="bg-slate-900 text-white rounded-xl p-6 shadow-xl border border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 italic text-blue-400">Execute Handover</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500">Recipient Address</label>
                    <input placeholder="Enter Public Key (0x...)" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-all" />
                  </div>

                  {role === "ANALYST" && (
                    <div className="space-y-4 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-blue-400">Forensic Summary (Required)</label>
                        <input placeholder="Findings overview..." value={summary} onChange={(e) => setSummary(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-500">Confidential Notes</label>
                        <textarea placeholder="Technical observations..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-lg text-xs h-20 resize-none" />
                      </div>
                    </div>
                  )}

                  <button onClick={handleTransfer} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[11px] py-3 rounded-lg shadow-lg tracking-[0.2em] transition-all">
                    Initiate Transfer
                  </button>
                </div>
              </div>
            )}

            {/* PENDING STATE */}
            {isOutgoing && (
              <div className="bg-white border-2 border-amber-200 p-6 rounded-xl text-center shadow-sm">
                <div className="flex justify-center mb-3">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-xs font-black uppercase text-slate-800 tracking-widest">Handover Pending</h3>
                <p className="text-[10px] text-slate-500 mt-2 font-medium">Waiting for the recipient to verify and sign for custody.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SYSTEM INTEGRITY FOOTER */}
      <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] bg-white px-6 py-2 rounded-lg border border-slate-200">
        <div className="flex items-center gap-4">
          <span className="text-blue-500 italic lowercase tracking-normal">Pramaan-Forensics-v3.0</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Secure Chain</span>
        </div>
        <div className="flex gap-6 italic">
          <span className="text-emerald-500 font-bold">Ledger Verified Asset</span>
          <span>© 2026 METAREALM</span>
        </div>
      </div>
    </div>
  );
}