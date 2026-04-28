"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../context/SessionContext";

export default function LoginPage() {
  const { login } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletData, setWalletData] = useState<any>(null);

  // 🔐 LOGIN
  const handleLogin = async () => {
    if (!name || !passphrase) return alert("Enter credentials");

    setLoading(true);

    const res = await fetch("http://localhost:4000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, passphrase }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      login(data);
      router.push("/");
    } else {
      alert("Login failed");
    }
  };

  // 🆕 SIGNUP (CREATE WALLET)
  const handleSignup = async () => {
    setLoading(true);

    const res = await fetch("http://localhost:4000/signup", {
      method: "POST",
    });

    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      return alert("Wallet creation failed");
    }

    // 🔥 Show modal instead of alert
    setWalletData(data);
  };

  // 📋 COPY FUNCTION
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied!");
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded shadow w-80">
        <h2 className="text-lg font-bold mb-4 text-center">
          PRAMAAN Login
        </h2>

        <input
          placeholder="Key Name"
          className="w-full mb-2 p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Passphrase"
          type="password"
          className="w-full mb-4 p-2 border rounded"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-900 text-white py-2 rounded mb-2"
        >
          {loading ? "Processing..." : "Login"}
        </button>

        <div className="text-center text-sm text-gray-500 my-2">
          OR
        </div>

        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded"
        >
          Create New Wallet
        </button>
      </div>

      {/* 🔥 WALLET MODAL */}
      {walletData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-[420px]">
            <h3 className="text-lg font-bold mb-4 text-red-600">
              ⚠️ Save Your Wallet Details
            </h3>

            <div className="text-sm mb-2 flex justify-between items-center">
              <div>
                <strong>Name:</strong> {walletData.name}
              </div>
              <button
                onClick={() => copyToClipboard(walletData.name)}
                className="text-blue-600 text-xs"
              >
                Copy
              </button>
            </div>

            <div className="text-sm mb-2 flex justify-between items-center">
              <div>
                <strong>Passphrase:</strong> {walletData.passphrase}
              </div>
              <button
                onClick={() => copyToClipboard(walletData.passphrase)}
                className="text-blue-600 text-xs"
              >
                Copy
              </button>
            </div>

            <div className="text-sm mb-2 flex justify-between items-center">
              <div className="break-all">
                <strong>Address:</strong> {walletData.address}
              </div>
              <button
                onClick={() => copyToClipboard(walletData.address)}
                className="text-blue-600 text-xs"
              >
                Copy
              </button>
            </div>

            <div className="text-sm mb-4">
              <strong>Mnemonic:</strong>
              <div className="bg-gray-100 p-2 rounded mt-1 text-xs break-words">
                {walletData.mnemonic}
              </div>
              <button
                onClick={() => copyToClipboard(walletData.mnemonic)}
                className="text-blue-600 text-xs mt-1"
              >
                Copy Mnemonic
              </button>
            </div>

            <button
              onClick={() => {
                setWalletData(null);
                login(walletData);
                router.push("/");
              }}
              className="w-full bg-blue-900 text-white py-2 rounded"
            >
              I Saved It, Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}