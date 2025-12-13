"use client";

import React, { useMemo, useState } from "react";
import {
  ShieldCheck,
  Link as LinkIcon,
  Wallet,
  Copy,
  Loader2,
  ExternalLink,
  Info,
} from "lucide-react";

declare global {
  interface Window {
    ethereum?: any;
  }
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function shortAddr(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Home() {
  const [walletAddress, setWalletAddress] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [price, setPrice] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const canSubmit = useMemo(
    () =>
      Boolean(walletAddress) &&
      Boolean(targetUrl) &&
      Boolean(price) &&
      !isLoading,
    [walletAddress, targetUrl, price, isLoading]
  );

  const connectWallet = async () => {
    setErrorMsg("");

    if (
      typeof window !== "undefined" &&
      typeof window.ethereum !== "undefined"
    ) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts?.[0] ?? "");
      } catch (e) {
        setErrorMsg("Gagal connect wallet. Pastikan MetaMask terbuka.");
      }
    } else {
      setErrorMsg("MetaMask tidak terdeteksi. Harap install extension-nya.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setGeneratedLink("");
    setCopied(false);

    try {
      if (!walletAddress) throw new Error("Mohon connect wallet terlebih dahulu");

      const res = await fetch("/api/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl,
          price: parseFloat(price),
          ownerAddress: walletAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Gagal membuat link");

      setGeneratedLink(`${window.location.origin}${data.data.fullUrl}`);
    } catch (error: any) {
      setErrorMsg(error?.message || String(error));
      // eslint-disable-next-line no-console
      console.error("Detail Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <main className="h-screen overflow-hidden bg-white text-slate-900">
      {/* subtle background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0.08),transparent_55%)]" />

      <div className="relative mx-auto flex h-full max-w-6xl items-center px-4">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Product / context */}
          <section className="self-start h-fit rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  <ShieldCheck className="h-4 w-4" />
                  x402 Protocol
                </div>

                <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                  PayLoad API
                </h1>

                {/* fixed 2 lines, single-line each with ellipsis */}
                <div className="mt-2 max-w-prose text-sm text-slate-600">
                  <p className="truncate whitespace-nowrap">
                    Monetize your API endpoints using the x402 protocol.
                  </p>
                  <p className="truncate whitespace-nowrap">
                    Because in this economy, You have to Pay to get the Load.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Mode</div>
                <div className="mt-1 text-sm font-medium">Pay-per-request</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Settlement</div>
                <div className="mt-1 text-sm font-medium">EVM wallet</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Output</div>
                <div className="mt-1 text-sm font-medium">Shareable link</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 text-slate-500" />
                <p className="text-sm text-slate-600">
                  Pro Tip: Use a minimal amount (
                  <span className="font-mono">0.0001</span> ETH) for testing.
                  Ensure your target endpoint is live and ready to handle
                  proxied requests.
                </p>
              </div>
            </div>
          </section>

          {/* Right: Main tool card */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Create payload link</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Connect wallet, masukkan url + harga, dan generate.
                </p>
              </div>

              {!walletAddress ? (
                <button
                  onClick={connectWallet}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <Wallet className="h-4 w-4" />
                  Connect wallet
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="max-w-[140px] truncate whitespace-nowrap font-mono text-sm text-slate-700">
                    {shortAddr(walletAddress)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Target API URL (hidden)
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://api.example.com/private"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                    />
                    <LinkIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    URL ini disimpan di backend dan tidak ditampilkan pada link.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Price per request (ETH)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.000001"
                    min="0"
                    placeholder="0.001"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={cx(
                    "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-300",
                    canSubmit
                      ? "bg-slate-900 text-white hover:bg-slate-800"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>Generate link</>
                  )}
                </button>
              </form>

              {errorMsg && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errorMsg}
                </div>
              )}

              {generatedLink && (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium text-slate-500">
                        Your monetized link
                      </div>
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                        <code className="block break-all font-mono text-xs text-slate-800">
                          {generatedLink}
                        </code>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        onClick={copyLink}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                        title="Copy"
                        type="button"
                      >
                        <Copy className="h-4 w-4" />
                        {copied ? "Copied" : "Copy"}
                      </button>

                      <a
                        href={generatedLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        title="Open"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Owner</div>
                      <div className="mt-1 break-all font-mono text-xs text-slate-800">
                        {walletAddress}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs text-slate-500">Price</div>
                      <div className="mt-1 font-mono text-xs text-slate-800">
                        {price} ETH / request
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* footer credit (fixed bottom, no scroll) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500">
          Developed by{" "}
          <a
            href="https://x.com/cahyorom"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-slate-700 underline underline-offset-2 decoration-slate-300 hover:text-slate-900"
          >
            Cahyo
          </a>
        </div>
      </div>
    </main>
  );
}