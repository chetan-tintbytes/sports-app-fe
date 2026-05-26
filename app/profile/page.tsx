"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { User } from "@/utils/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const Toast = ({ msg, type }: { msg: string; type: "success" | "error" }) => (
  <div
    className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`}
  >
    {msg}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="relative border border-gray-200 rounded-2xl p-6 mb-6">
    <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">
      {title}
    </span>
    {children}
  </div>
);

const Row = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-400 uppercase tracking-wide sm:w-40 flex-shrink-0 pt-0.5">
      {label}
    </span>
    <span className="text-sm text-gray-800">{value || "—"}</span>
  </div>
);

// ─── Profile Image Section ────────────────────────────────────────────────────

const ProfileImageSection = ({
  user,
  onUpdate,
  showToast,
}: {
  user: User;
  onUpdate: (u: User) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const ALLOWED = ["image/png", "image/gif", "image/bmp", "image/jpeg"];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      showToast("Only PNG, GIF, BMP, JPG/JPEG allowed.", "error");
      return;
    }
    const token = getToken();
    if (!token) return;
    setUploading(true);
    setProgress(0);
    try {
      const { upload_url, key } = await api.presignUserProfileImage(token, {
        content_type: file.type,
        filename: `profile_${Date.now()}`,
      });
      await api.uploadToS3(upload_url, file, setProgress);
      const updated = await api.updateProfile(token, { profile_image_key: key });
      onUpdate(updated);
      showToast("Profile photo updated!");
    } catch {
      showToast("Failed to upload photo.", "error");
    } finally {
      setUploading(false);
      setProgress(0);
    }
    e.target.value = "";
  };

  return (
    <Section title="Profile Photo">
      <div className="flex items-center gap-5">
        {/* Avatar preview */}
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
          {user.profile_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.profile_image_url}
              alt={user.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-3xl font-bold text-gray-400 select-none">
              {user.name?.charAt(0)?.toUpperCase() ?? "A"}
            </span>
          )}
        </div>

        <div>
          <label
            className={`cursor-pointer inline-flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors ${
              uploading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            {uploading ? `Uploading ${progress}%…` : "📷 Upload Photo"}
            <input
              type="file"
              accept=".png,.gif,.bmp,.jpg,.jpeg"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-gray-400 mt-1.5">
            PNG, GIF, BMP, JPG/JPEG · Min 250×150 px
          </p>
          {uploading && (
            <div className="mt-2 h-1.5 w-40 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </Section>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const profile = await api.getProfile(token);
      setUser(profile);
    } catch {
      showToast("Failed to load profile.", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const enterEdit = () => {
    if (!user) return;
    setEditName(user.name);
    setEditMode(true);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditError("");
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      setEditError("Name cannot be empty.");
      return;
    }
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setEditError("");
    try {
      const updated = await api.updateProfile(token, { name: editName.trim() });
      setUser(updated);
      setEditMode(false);
      showToast("Name updated!");
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Spinner />
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <p className="text-gray-500">Could not load profile.</p>
      </div>
    );

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
          >
            ← Back
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">My Profile</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Manage your account details and photo
              </p>
            </div>

            <div className="flex gap-2">
              {!editMode ? (
                <button
                  onClick={enterEdit}
                  className="bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow"
                >
                  ✏ EDIT NAME
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow"
                  >
                    {saving ? "Saving…" : "✓ SAVE"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    CANCEL
                  </button>
                </>
              )}
            </div>
          </div>

          {editError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {editError}
            </div>
          )}

          {/* Profile Photo */}
          <ProfileImageSection user={user} onUpdate={setUser} showToast={showToast} />

          {/* Account Info */}
          <Section title="Account Details">
            {!editMode ? (
              <>
                <Row label="Name" value={user.name} />
                <Row label="Email" value={user.email} />
                <Row label="Member Since" value={fmt(user.created_at)} />
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-50">
                  <label className="text-xs text-gray-500 uppercase tracking-wide sm:w-40 flex-shrink-0">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none"
                  />
                </div>
                <Row label="Email" value={user.email} />
                <Row label="Member Since" value={fmt(user.created_at)} />
              </>
            )}
          </Section>

          {/* Meta */}
          <div className="mt-2 text-xs text-gray-400">
            Account ID: #{user.id}
          </div>
        </div>
      </div>
    </>
  );
}