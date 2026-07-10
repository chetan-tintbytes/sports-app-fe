"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  Video,
  Building2,
  Users,
  UserCircle,
  BarChart3,
  BookOpen,
  X,
  ChevronDown,
  LogOut,
  Mail,
  ShieldCheck,
  LucideProps,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { api } from "@/utils/lib/api";
import { getToken, removeToken } from "@/utils/lib/auth";
import { User } from "@/utils/types";

interface SubMenuItem {
  label: string;
  path: string;
}

interface MenuItem {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  label: string;
  path: string;
  hasSubmenu?: boolean;
  subItems?: SubMenuItem[];
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    ORGANISATION: true,
    VIDEOS: true,
  });
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // ── Email verification state ──────────────────────────────────────────────
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState<"prompt" | "otp">("prompt");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [verifySending, setVerifySending] = useState(false);
  const [verifySubmitting, setVerifySubmitting] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const profile = await api.getProfile(token);
        setUser(profile);

        // Show verification modal for non-admin members who haven't verified,
        // but only once per browser session (sessionStorage is cleared on tab close).
        if (
          !profile.is_admin &&
          !profile.email_verified &&
          typeof window !== "undefined" &&
          !sessionStorage.getItem("email_verify_dismissed")
        ) {
          setShowVerifyModal(true);
        }
      } catch {
        removeToken();
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  const dismissVerifyModal = useCallback(() => {
    setShowVerifyModal(false);
    setVerifyStep("prompt");
    setOtpValues(["", "", "", "", "", ""]);
    setVerifyError("");
    setVerifySuccess(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("email_verify_dismissed", "1");
    }
  }, []);

  const handleSendOTP = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setVerifySending(true);
    setVerifyError("");
    try {
      await api.sendVerificationOTP(token);
      setVerifyStep("otp");
      setCooldown(60);
      setOtpValues(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (e: unknown) {
      setVerifyError(e instanceof Error ? e.message : "Failed to send code");
    } finally {
      setVerifySending(false);
    }
  }, []);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      // Only allow digits
      const digit = value.replace(/\D/g, "").slice(-1);
      const next = [...otpValues];
      next[index] = digit;
      setOtpValues(next);
      setVerifyError("");

      // Auto-advance to next input
      if (digit && index < 5) {
        otpRefs.current[index + 1]?.focus();
      }
    },
    [otpValues]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !otpValues[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    },
    [otpValues]
  );

  const handleOtpPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
      if (!pasted) return;
      const next = ["", "", "", "", "", ""];
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      setOtpValues(next);
      // Focus the next empty or the last field
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
    },
    []
  );

  const handleVerifyOTP = useCallback(async () => {
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      setVerifyError("Please enter the full 6-digit code");
      return;
    }
    const token = getToken();
    if (!token) return;
    setVerifySubmitting(true);
    setVerifyError("");
    try {
      await api.verifyEmailOTP(token, otp);
      setVerifySuccess(true);
      // Update local user state
      setUser((prev) => (prev ? { ...prev, email_verified: true } : prev));
      // Close after a short delay
      setTimeout(() => {
        setShowVerifyModal(false);
        setVerifyStep("prompt");
        setVerifySuccess(false);
      }, 2000);
    } catch (e: unknown) {
      setVerifyError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setVerifySubmitting(false);
    }
  }, [otpValues]);

  const handleLogout = () => {
    removeToken();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("email_verify_dismissed");
    }
    router.push("/login");
  };

  const adminMenuItems: MenuItem[] = [
    { icon: Upload, label: "IMPORT/UPLOAD VIDEOS", path: "/upload" },
    {
      icon: Video,
      label: "VIDEOS",
      path: "/videos",
      hasSubmenu: true,
      subItems: [
        { label: "My Videos", path: "/videos/my-videos" },
        { label: "All Videos", path: "/videos/all" },
      ],
    },
    {
      icon: Building2,
      label: "ORGANISATION",
      path: "/organisation",
      hasSubmenu: true,
      subItems: [
        { label: "Organisation Dashboard", path: "/organisation/dashboard" },
        { label: "Member List", path: "/organisation/list" },
      ],
    },
    // { icon: Users, label: "GROUP", path: "/group" },
    { icon: UserCircle, label: "ATHLETES", path: "/athletes" },
    { icon: BarChart3, label: "REPORTS", path: "/reports" },
    { icon: BookOpen, label: "USER GUIDE", path: "/guide" },
  ];

  const memberMenuItems: MenuItem[] = [
    { icon: Upload, label: "IMPORT/UPLOAD VIDEOS", path: "/upload" },
    { icon: Video, label: "VIDEOS", path: "/videos/my-videos" },
    { icon: Users, label: "MEMBERS", path: "/organisation/list" },
    { icon: BarChart3, label: "REPORTS", path: "/reports" },
    { icon: BookOpen, label: "USER GUIDE", path: "/guide" },
  ];

  const menuItems = user?.is_admin ? adminMenuItems : memberMenuItems;

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const MenuItemComponent = ({ item }: { item: MenuItem }) => {
    const isExpanded = expandedMenus[item.label];
    return (
      <div className="mb-1">
        <Link
          href={item.path}
          className="flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 group"
          onClick={(e) => {
            if (item.hasSubmenu) {
              e.preventDefault();
              toggleSubmenu(item.label);
            } else {
              setIsSidebarOpen(false);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <item.icon
              size={18}
              className="text-gray-400 group-hover:text-white"
            />
            <span className="text-xs font-medium tracking-wide">
              {item.label}
            </span>
          </div>
          {item.hasSubmenu && (
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          )}
        </Link>

        {item.hasSubmenu && isExpanded && item.subItems && (
          <div className="mt-1 ml-9 flex flex-col gap-1 border-l border-slate-700">
            {item.subItems.map((subItem, idx) => (
              <Link
                key={idx}
                href={subItem.path}
                onClick={() => setIsSidebarOpen(false)}
                className="block px-4 py-2 text-[11px] text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors"
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-800 to-slate-900 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Profile section */}
          <div className="p-6 border-b border-slate-700">
            <Link
              href="/profile"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 group"
            >
              {/* Avatar */}
              <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                {user?.profile_image_url ? (
                  // Plain <img> avoids Next.js caching issues with short-lived presigned URLs
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profile_image_url}
                    alt={user.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white select-none">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
                  </span>
                )}
              </div>

              {/* Name + role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-white truncate group-hover:text-blue-300 transition-colors">
                    {user?.name ?? "Loading…"}
                  </span>
                  <ChevronDown
                    size={12}
                    className="text-gray-400 flex-shrink-0"
                  />
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-tighter mt-0.5">
                  {user?.is_admin ? "Admin" : user?.role_name || "Member"}
                </p>
              </div>
            </Link>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-slate-700">
            {menuItems.map((item, index) => (
              <MenuItemComponent key={index} item={item} />
            ))}
          </nav>

          {/* Logout button */}
          <div className="p-3 border-t border-slate-700">
            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-200 group"
              >
                <LogOut size={18} className="group-hover:text-red-400" />
                <span className="text-xs font-medium tracking-wide">
                  LOGOUT
                </span>
              </button>
            ) : (
              <div className="bg-slate-700/60 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-300 mb-3 text-center">
                  Sign out of your account?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* ── Email Verification Modal ──────────────────────────────────────── */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-500 to-blue-500 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Mail size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg leading-tight">
                    Verify your email
                  </h2>
                  <p className="text-white/70 text-xs mt-0.5">
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={dismissVerifyModal}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {verifySuccess ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck size={28} className="text-green-600" />
                  </div>
                  <p className="text-gray-800 font-semibold text-lg">
                    Email verified!
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Your email has been successfully verified.
                  </p>
                </div>
              ) : verifyStep === "prompt" ? (
                <>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Please verify your email address to secure your account.
                    We&apos;ll send a 6-digit code to{" "}
                    <strong className="text-gray-800">{user?.email}</strong>.
                  </p>
                  {verifyError && (
                    <div className="mt-3 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                      {verifyError}
                    </div>
                  )}
                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={dismissVerifyModal}
                      className="flex-1 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      Later
                    </button>
                    <button
                      onClick={handleSendOTP}
                      disabled={verifySending}
                      className="flex-1 py-2.5 text-sm font-semibold text-white bg-violet-500 hover:bg-violet-600 disabled:opacity-60 rounded-xl transition-colors"
                    >
                      {verifySending ? "Sending…" : "Send Code"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Enter the 6-digit code we sent to{" "}
                    <strong className="text-gray-800">{user?.email}</strong>
                  </p>

                  {/* OTP Inputs */}
                  <div className="flex justify-center gap-2.5 mb-4">
                    {otpValues.map((val, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-14 text-center text-xl font-bold text-gray-800 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                      />
                    ))}
                  </div>

                  {verifyError && (
                    <div className="mb-3 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center">
                      {verifyError}
                    </div>
                  )}

                  <button
                    onClick={handleVerifyOTP}
                    disabled={verifySubmitting || otpValues.join("").length !== 6}
                    className="w-full py-2.5 text-sm font-semibold text-white bg-violet-500 hover:bg-violet-600 disabled:opacity-60 rounded-xl transition-colors"
                  >
                    {verifySubmitting ? "Verifying…" : "Verify Email"}
                  </button>

                  {/* Resend */}
                  <div className="mt-3 text-center">
                    {cooldown > 0 ? (
                      <p className="text-xs text-gray-400">
                        Resend code in {cooldown}s
                      </p>
                    ) : (
                      <button
                        onClick={handleSendOTP}
                        disabled={verifySending}
                        className="text-xs text-violet-500 hover:text-violet-600 font-medium transition-colors"
                      >
                        {verifySending ? "Sending…" : "Resend code"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}