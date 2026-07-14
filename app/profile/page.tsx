"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/lib/api";
import { getToken, getUserId } from "@/utils/lib/auth";
import {
  User,
  UserProfile,
  UpdateUserProfileRequest,
  PREDEFINED_SPORTS,
  GENDERS,
} from "@/utils/types";

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

// A labelled input row used in edit mode.
const EditRow = ({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-50 last:border-0">
    <label className="text-xs text-gray-500 uppercase tracking-wide sm:w-40 flex-shrink-0">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="flex-1">{children}</div>
  </div>
);

const inputCls =
  "w-full bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none";

// ─── Edit state ───────────────────────────────────────────────────────────────

interface EditState {
  name: string;
  dob: string;
  gender: string;
  phone: string;
  mainSport: string;
  otherSport: string;
  height: string;
  weight: string;
  armSpan: string;
  legLength: string;
  shoeSize: string;
  otherMetrics: { name: string; value: string }[];
}

const buildEditState = (user: User, p: UserProfile | null): EditState => ({
  name: user.name ?? "",
  dob: p?.date_of_birth ? p.date_of_birth.substring(0, 10) : "",
  gender: p?.gender ?? "",
  phone: p?.phone_no ?? "",
  mainSport: p?.main_sports?.[0] ?? "",
  otherSport: p?.other_sports?.[0] ?? "",
  height: p?.height != null ? String(p.height) : "",
  weight: p?.weight != null ? String(p.weight) : "",
  armSpan: p?.arm_span != null ? String(p.arm_span) : "",
  legLength: p?.leg_length != null ? String(p.leg_length) : "",
  shoeSize: p?.shoe_size != null ? String(p.shoe_size) : "",
  otherMetrics: [
    ...Object.entries(p?.other_metrics ?? {}).map(([n, v]) => ({
      name: n,
      value: String(v),
    })),
    { name: "", value: "" },
  ],
});

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [edit, setEdit] = useState<EditState | null>(null);
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
      const profileUser = await api.getProfile(token);
      setUser(profileUser);

      // Admins don't have a sports/physical profile — skip that record.
      // For everyone else it lives in a separate record; load it best-effort.
      if (profileUser.is_admin) {
        setProfile(null);
      } else {
        try {
          const uid = getUserId();
          const sports = await api.getUserProfile(token, uid);
          setProfile(sports);
        } catch {
          setProfile(null);
        }
      }
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
    setEdit(buildEditState(user, profile));
    setEditMode(true);
    setEditError("");
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditError("");
  };

  const setField = (field: keyof EditState, value: string) =>
    setEdit((prev) => (prev ? { ...prev, [field]: value } : prev));

  const setMetric = (idx: number, key: "name" | "value", value: string) =>
    setEdit((prev) => {
      if (!prev) return prev;
      const metrics = prev.otherMetrics.map((m, i) =>
        i === idx ? { ...m, [key]: value } : m
      );
      // Keep a trailing empty row so the user can always add another.
      const last = metrics[metrics.length - 1];
      if (last && (last.name.trim() || last.value.trim())) {
        metrics.push({ name: "", value: "" });
      }
      return { ...prev, otherMetrics: metrics };
    });

  const numOrNull = (s: string) => (s.trim() ? parseFloat(s) : null);

  const handleSave = async () => {
    if (!edit || !user) return;
    if (!edit.name.trim()) {
      setEditError("Name cannot be empty.");
      return;
    }
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setEditError("");
    try {
      // Name lives on the user record; update it for everyone.
      const updatedUser = await api.updateProfile(token, { name: edit.name.trim() });
      setUser(updatedUser);

      // Physical/sports fields only apply to non-admin users.
      if (!user.is_admin) {
        const otherMetrics = edit.otherMetrics
          .filter((m) => m.name.trim())
          .reduce<Record<string, string>>((acc, m) => {
            acc[m.name.trim()] = m.value;
            return acc;
          }, {});

        const sportsUpdate: UpdateUserProfileRequest = {
          date_of_birth: edit.dob ? `${edit.dob}T00:00:00Z` : null,
          gender: edit.gender || "",
          phone_no: edit.phone || "",
          main_sports: edit.mainSport ? [edit.mainSport] : [],
          other_sports: edit.otherSport ? [edit.otherSport] : [],
          height: numOrNull(edit.height),
          weight: numOrNull(edit.weight),
          arm_span: numOrNull(edit.armSpan),
          leg_length: numOrNull(edit.legLength),
          shoe_size: numOrNull(edit.shoeSize),
          other_metrics: otherMetrics,
        };

        const uid = getUserId();
        await api.updateUserProfile(token, uid, sportsUpdate);

        // Reload the sports profile so the view reflects the saved values.
        try {
          const sports = await api.getUserProfile(token, uid);
          setProfile(sports);
        } catch {
          /* keep previous profile if reload fails */
        }
      }

      setEditMode(false);
      showToast("Profile updated!");
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

  const groups = profile?.groups ?? [];
  const roleName = user.is_admin ? "Administrator" : user.role_name || profile?.role_name || "—";

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.push("/dashboard")}
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
                  ✏ EDIT PROFILE
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

          {/* Account Details */}
          <Section title="Account Details">
            {!editMode ? (
              <Row label="Name" value={user.name} />
            ) : (
              <EditRow label="Name" required>
                <input
                  value={edit?.name ?? ""}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Your name"
                  className={inputCls}
                />
              </EditRow>
            )}

            <Row
              label="Email"
              value={
                <span className="inline-flex items-center gap-2">
                  {user.email}
                  {user.email_verified ? (
                    <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
                      VERIFIED
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                      UNVERIFIED
                    </span>
                  )}
                </span>
              }
            />
            <Row label="Member Since" value={fmt(user.created_at)} />
          </Section>

          {/* Personal & Physical Details — not shown for admins */}
          {!user.is_admin && (
          <Section title="Personal & Physical Details">
            {!editMode ? (
              <>
                <Row
                  label="Date of Birth"
                  value={profile?.date_of_birth ? fmt(profile.date_of_birth) : null}
                />
                <Row label="Gender" value={profile?.gender} />
                <Row label="Phone" value={profile?.phone_no} />
                <Row label="Main Sport" value={profile?.main_sports?.[0]} />
                <Row label="Other Sport" value={profile?.other_sports?.[0]} />
                <Row
                  label="Height"
                  value={profile?.height != null ? `${profile.height} cm` : null}
                />
                <Row
                  label="Weight"
                  value={profile?.weight != null ? `${profile.weight} kg` : null}
                />
                <Row
                  label="Arm Span"
                  value={profile?.arm_span != null ? `${profile.arm_span} cm` : null}
                />
                <Row
                  label="Leg Length"
                  value={profile?.leg_length != null ? `${profile.leg_length} cm` : null}
                />
                <Row
                  label="Shoe Size"
                  value={profile?.shoe_size != null ? String(profile.shoe_size) : null}
                />
                {Object.entries(profile?.other_metrics ?? {}).map(([k, v]) => (
                  <Row key={k} label={k} value={String(v)} />
                ))}
              </>
            ) : (
              <>
                <EditRow label="Date of Birth">
                  <input
                    type="date"
                    value={edit?.dob ?? ""}
                    onChange={(e) => setField("dob", e.target.value)}
                    className={inputCls}
                  />
                </EditRow>
                <EditRow label="Gender">
                  <select
                    value={edit?.gender ?? ""}
                    onChange={(e) => setField("gender", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select…</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </EditRow>
                <EditRow label="Phone">
                  <input
                    value={edit?.phone ?? ""}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="Phone number"
                    className={inputCls}
                  />
                </EditRow>
                <EditRow label="Main Sport">
                  <select
                    value={edit?.mainSport ?? ""}
                    onChange={(e) => setField("mainSport", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select…</option>
                    {PREDEFINED_SPORTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </EditRow>
                <EditRow label="Other Sport">
                  <select
                    value={edit?.otherSport ?? ""}
                    onChange={(e) => setField("otherSport", e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Select…</option>
                    {PREDEFINED_SPORTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </EditRow>
                <EditRow label="Height (cm)">
                  <input
                    type="number"
                    step="any"
                    value={edit?.height ?? ""}
                    onChange={(e) => setField("height", e.target.value)}
                    placeholder="e.g. 178"
                    className={inputCls}
                  />
                </EditRow>
                <EditRow label="Weight (kg)">
                  <input
                    type="number"
                    step="any"
                    value={edit?.weight ?? ""}
                    onChange={(e) => setField("weight", e.target.value)}
                    placeholder="e.g. 72"
                    className={inputCls}
                  />
                </EditRow>
                <EditRow label="Arm Span (cm)">
                  <input
                    type="number"
                    step="any"
                    value={edit?.armSpan ?? ""}
                    onChange={(e) => setField("armSpan", e.target.value)}
                    placeholder="e.g. 180"
                    className={inputCls}
                  />
                </EditRow>
                <EditRow label="Leg Length (cm)">
                  <input
                    type="number"
                    step="any"
                    value={edit?.legLength ?? ""}
                    onChange={(e) => setField("legLength", e.target.value)}
                    placeholder="e.g. 95"
                    className={inputCls}
                  />
                </EditRow>
                <EditRow label="Shoe Size">
                  <input
                    type="number"
                    step="any"
                    value={edit?.shoeSize ?? ""}
                    onChange={(e) => setField("shoeSize", e.target.value)}
                    placeholder="e.g. 9"
                    className={inputCls}
                  />
                </EditRow>

                {/* Custom metrics */}
                <div className="pt-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Other Metrics
                  </p>
                  <div className="space-y-2">
                    {edit?.otherMetrics.map((m, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={m.name}
                          onChange={(e) => setMetric(i, "name", e.target.value)}
                          placeholder="Metric name"
                          className={inputCls}
                        />
                        <input
                          value={m.value}
                          onChange={(e) => setMetric(i, "value", e.target.value)}
                          placeholder="Value"
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </Section>
          )}

          {/* Role & Groups (read-only) */}
          <Section title="Role & Groups">
            <Row label="Role" value={roleName} />
            <Row
              label="Groups"
              value={
                groups.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {groups.map((g) => (
                      <span
                        key={g.id}
                        className="text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-2.5 py-0.5"
                      >
                        {g.name}
                      </span>
                    ))}
                  </span>
                ) : null
              }
            />
            <p className="text-xs text-gray-400 pt-2">
              Role and group assignments are managed by your administrator.
            </p>
          </Section>

          {/* Security */}
          <Section title="Security">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-800">Password</p>
                <p className="text-xs text-gray-400">Change the password you use to sign in.</p>
              </div>
              <button
                onClick={() => router.push("/profile/change-password")}
                className="bg-white border border-violet-300 text-violet-600 hover:bg-violet-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                CHANGE PASSWORD
              </button>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2.5">
              <div>
                <p className="text-sm font-medium text-gray-800">Email Address</p>
                <p className="text-xs text-gray-400">
                  Update your email — we&apos;ll verify the new address with a code.
                </p>
              </div>
              <button
                onClick={() => router.push("/profile/change-email")}
                className="bg-white border border-violet-300 text-violet-600 hover:bg-violet-50 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                CHANGE EMAIL
              </button>
            </div>
          </Section>

          {/* Meta */}
          <div className="mt-2 text-xs text-gray-400">Account ID: #{user.id}</div>
        </div>
      </div>
    </>
  );
}