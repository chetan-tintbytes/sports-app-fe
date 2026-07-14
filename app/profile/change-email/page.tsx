"use client";

import React, { useState, useEffect, useRef, useCallback, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/utils/lib/api";
import { getToken, setToken } from "@/utils/lib/auth";

type Step = "enter" | "otp" | "done";

export default function ChangeEmailPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("enter");
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (!getToken()) router.push("/login");
  }, [router]);

  // Resend cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());

  const sendOtp = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setSending(true);
    setError("");
    try {
      await api.sendEmailChangeOTP(token, newEmail.trim());
      setStep("otp");
      setInfo(`We sent a 6-digit code to ${newEmail.trim()}. It expires in 10 minutes.`);
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send verification code.");
    } finally {
      setSending(false);
    }
  }, [newEmail, router]);

  const handleSendSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }
    sendOtp();
  };

  const setOtpDigit = (idx: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextVals = [...otp];
    nextVals[idx] = digit;
    setOtp(nextVals);
    setError("");
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const nextVals = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) nextVals[i] = pasted[i];
    setOtp(nextVals);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verify = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const res = await api.verifyEmailChangeOTP(token, code);
      // Keep the session in sync with the new email.
      if (res.token) setToken(res.token);
      setStep("done");
      setInfo(res.message || "Email changed successfully.");
      setTimeout(() => router.push("/profile"), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }, [otp, router]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          ← Back to Profile
        </button>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-violet-500 rounded-2xl shadow mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Change email</h1>
            <p className="text-gray-500 text-sm">
              {step === "enter"
                ? "Enter your new email. We'll send a verification code to it and alert your current address."
                : step === "otp"
                ? "Enter the code we sent to your new email to complete the change."
                : "Your email has been updated."}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          {info && step !== "enter" && (
            <div className="mb-4 bg-violet-50 border border-violet-200 text-violet-700 px-4 py-3 rounded-xl text-sm">
              {info}
            </div>
          )}

          {/* Step 1: enter new email */}
          {step === "enter" && (
            <form onSubmit={handleSendSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-sm text-gray-700 placeholder-gray-400 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={sending || !emailValid}
                className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3" />
                      <path d="M12 3a9 9 0 019 9" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  "Send Verification Code"
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === "otp" && (
            <div className="space-y-5">
              <div className="flex justify-between gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpRefs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => setOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent text-gray-800"
                  />
                ))}
              </div>

              <button
                onClick={verify}
                disabled={verifying || otp.join("").length !== 6}
                className="w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".3" />
                      <path d="M12 3a9 9 0 019 9" />
                    </svg>
                    Verifying…
                  </>
                ) : (
                  "Verify & Change Email"
                )}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  onClick={() => {
                    setStep("enter");
                    setError("");
                    setInfo("");
                  }}
                  className="text-gray-500 hover:text-gray-800 transition-colors"
                >
                  ← Use a different email
                </button>
                <button
                  onClick={sendOtp}
                  disabled={cooldown > 0 || sending}
                  className="text-violet-600 hover:text-violet-700 disabled:text-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: done */}
          {step === "done" && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Email updated. Redirecting to your profile…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}