"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

interface InviteInfo {
  email: string;
  name: string;
  role_name: string;
}

// ── Inner component — uses useSearchParams so must live inside <Suspense> ──────

function AcceptInviteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "success">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No invite token found. Please use the link from your email.");
      return;
    }
    fetch(`${API}/auth/invite?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error ?? "Invalid or expired invitation");
        }
        return res.json();
      })
      .then((d: InviteInfo) => {
        setInfo(d);
        setStatus("ready");
      })
      .catch((e) => {
        setStatus("error");
        setErrorMsg(e.message);
      });
  }, [token]);

  const handleSubmit = async () => {
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Passwords do not match");
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/accept-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to activate account");
      localStorage.setItem("token", d.token);
      localStorage.setItem("user", JSON.stringify(d.user));
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0f1623]">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[420px] flex-shrink-0 flex-col bg-[#1a2035] relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl" />
        <div className="relative z-10 flex flex-col h-full p-10">
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">SportsApp</span>
          </div>
          <div className="space-y-4">
            <h2 className="text-white text-3xl font-bold leading-tight">
              You've been<br />
              <span className="text-blue-400">invited.</span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Set your password to activate your account and join your organisation.
            </p>
            {info && (
              <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 space-y-2">
                <div className="text-slate-400 text-xs uppercase tracking-widest">Your account</div>
                <div className="text-white font-semibold">{info.name}</div>
                <div className="text-slate-300 text-sm">{info.email}</div>
                {info.role_name && (
                  <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-xs font-medium px-2.5 py-1 rounded-full">
                    <span>●</span> {info.role_name}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {status === "loading" && (
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-400 text-sm">Validating invitation…</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-semibold">Invitation Invalid</h2>
              <p className="text-slate-400 text-sm">{errorMsg}</p>
              <p className="text-slate-500 text-xs">Please contact your administrator to resend the invitation.</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-semibold">Account activated!</h2>
              <p className="text-slate-400 text-sm">Redirecting you to your dashboard…</p>
            </div>
          )}

          {status === "ready" && (
            <div className="space-y-6">
              {/* Mobile header */}
              <div className="lg:hidden text-center space-y-1">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                      <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">SportsApp</span>
                </div>
                {info && (
                  <div className="bg-[#1a2035] rounded-xl p-3 border border-white/10 text-left mb-2">
                    <div className="text-slate-400 text-xs">Invited as</div>
                    <div className="text-white font-medium text-sm">{info.name} · {info.role_name}</div>
                    <div className="text-slate-400 text-xs">{info.email}</div>
                  </div>
                )}
              </div>

              <div>
                <h1 className="text-white text-2xl font-bold">Set your password</h1>
                <p className="text-slate-400 text-sm mt-1">
                  Choose a secure password to complete your account setup.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Email</label>
                  <input
                    type="email"
                    value={info?.email ?? ""}
                    disabled
                    className="w-full bg-white/5 border border-white/10 text-slate-400 rounded-xl px-4 py-3 text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">New Password</label>
                  <input
                    type="password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                    {errorMsg}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  {submitting ? "Activating…" : "Activate Account"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page export — Suspense required for useSearchParams in App Router ──────────

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0f1623]">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AcceptInviteInner />
    </Suspense>
  );
}