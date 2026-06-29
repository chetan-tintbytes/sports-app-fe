"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import {
  MemberStats,
  OrgGroup,
  ALL_MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
  MEMBER_TYPE_ICONS,
  Role,
  CreateInvitationResponse,
} from "@/utils/types";

// ─── Shared mini-components ───────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
  </div>
);

const Toast = ({ msg, type }: { msg: string; type: "success" | "error" }) => (
  <div
    className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white transition-all
      ${type === "success" ? "bg-green-500" : "bg-red-500"}`}
  >
    {msg}
  </div>
);

const FormField = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
    <label className="text-sm text-gray-600 sm:w-40 flex-shrink-0">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="flex-1">{children}</div>
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-violet-300 border-none"
  />
);

const Select = ({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700
      focus:outline-none focus:ring-2 focus:ring-violet-300 border-none appearance-none"
  >
    <option value="">{placeholder}</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface InviteFormState {
  roleId: string;
  name: string;
  email: string;
}

const emptyForm = (): InviteFormState => ({ roleId: "", name: "", email: "" });

type View = "dashboard" | "add";

// ─── Stat card ────────────────────────────────────────────────────────────────

const colorMap: Record<string, string> = {
  total: "bg-teal-50 border-teal-100 text-teal-600",
  coach: "bg-pink-50 border-pink-100 text-rose-500",
  athlete: "bg-pink-50 border-pink-100 text-rose-500",
  analyst: "bg-pink-50 border-pink-100 text-rose-500",
  health_staff: "bg-pink-50 border-pink-100 text-rose-500",
  student: "bg-pink-50 border-pink-100 text-rose-500",
  patient: "bg-pink-50 border-pink-100 text-rose-500",
  player: "bg-pink-50 border-pink-100 text-rose-500",
  account_admin_manager: "bg-pink-50 border-pink-100 text-rose-500",
  remote_coach: "bg-pink-50 border-pink-100 text-rose-500",
};

// ─── Add Member Form (invitation-based) ──────────────────────────────────────

const AddMemberForm = ({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) => {
  const [form, setForm] = useState<InviteFormState>(emptyForm());
  const [roles, setRoles] = useState<Role[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [inviteResult, setInviteResult] = useState<CreateInvitationResponse | null>(null);

  const set = (field: keyof InviteFormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api.getRoles(token).then(setRoles).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.roleId) { setError("Role is required."); return; }
    if (!form.name.trim()) { setError("Name is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    setError("");
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    try {
      const result = await api.createMember(token, {
        name: form.name.trim(),
        email: form.email.trim(),
        role_id: parseInt(form.roleId),
      });
      setInviteResult(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setSubmitting(false);
    }
  };

  const roleOptions = roles.map((r) => ({ value: String(r.id), label: r.name }));

  // ── Success state ──
  if (inviteResult) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Invitation Sent!</h2>
            <p className="text-sm text-gray-500 mb-6">
              <strong>{inviteResult.invitation.name}</strong> ({inviteResult.invitation.email}) has been invited as{" "}
              <strong>{inviteResult.role.name}</strong>. They will receive a link to set their password.
            </p>
            {inviteResult.email_warning && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-xl text-left">
                ⚠️ Email delivery warning: {inviteResult.email_warning}
              </div>
            )}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Invite link (share manually if needed)</p>
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <span className="text-xs text-gray-600 flex-1 truncate">{inviteResult.invite_link}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(inviteResult.invite_link)}
                  className="text-violet-500 hover:text-violet-700 text-xs font-semibold flex-shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setInviteResult(null); setForm(emptyForm()); }}
                className="bg-violet-400 hover:bg-violet-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors shadow"
              >
                Invite Another
              </button>
              <button
                onClick={onSuccess}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-colors shadow"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">Invite Member</h1>

        <p className="text-sm text-gray-500 text-center mb-6">
          An invitation email will be sent. The member sets their own password when they accept.
          Sports and physical data can be filled in on their profile page after joining.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="divide-y divide-gray-50">
            <FormField label="Role:" required>
              <Select
                value={form.roleId}
                onChange={(v) => set("roleId", v)}
                options={roleOptions}
                placeholder={roles.length ? "Select role" : "Loading roles…"}
              />
            </FormField>
            <FormField label="Name:" required>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Full name"
              />
            </FormField>
            <FormField label="Email Address:" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="Email address"
              />
            </FormField>
          </div>

          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-violet-400 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow"
            >
              {submitting ? "Sending…" : "SEND INVITE"}
            </button>
            <button
              onClick={() => setForm(emptyForm())}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow"
            >
              RESET
            </button>
            <button
              onClick={onBack}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard View ───────────────────────────────────────────────────────────

const DashboardView = ({
  stats,
  orgName,
  loading,
  onAddMember,
}: {
  stats: MemberStats | null;
  orgName: string;
  loading: boolean;
  onAddMember: () => void;
}) => {
  const router = useRouter();

  const cards = [
    { id: "total", label: "Total Members", icon: "👥", count: stats?.total ?? 0, color: "teal" },
    ...ALL_MEMBER_TYPES.map((t) => ({
      id: t,
      label: MEMBER_TYPE_LABELS[t],
      icon: MEMBER_TYPE_ICONS[t],
      count: stats?.by_type?.[t] ?? 0,
      color: "pink",
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-1">My Organisation</h1>
        {orgName && (
          <p className="text-center text-gray-500 text-sm mb-6">{orgName}</p>
        )}

        <div className="flex justify-center mb-8">
          <button
            onClick={onAddMember}
            className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-8 py-3.5 rounded-xl transition-colors shadow"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            ADD NEW MEMBER
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {cards.map((card) => {
              const colors = colorMap[card.id] ?? "bg-pink-50 border-pink-100 text-rose-500";
              return (
                <button
                  key={card.id}
                  onClick={() =>
                    card.id === "total"
                      ? router.push("/organisation/list")
                      : router.push(`/organisation/list?type=${card.id}`)
                  }
                  className={`${colors} border rounded-2xl p-5 text-left hover:shadow-md transition-shadow`}
                >
                  <div className="text-2xl mb-2">{card.icon}</div>
                  <div className="text-3xl font-bold">{card.count}</div>
                  <div className="text-xs font-medium mt-1 leading-tight">{card.label}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function OrganisationDashboard() {
  const router = useRouter();
  const [view, setView] = useState<View>("dashboard");
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const [statsData, groupsData, orgData] = await Promise.all([
        api.getMemberStats(token),
        api.getGroups(token),
        api.getOrganisation(token),
      ]);
      setStats(statsData);
      setGroups(groupsData);
      setOrgName(orgData.name);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  if (view === "add") {
    return (
      <AddMemberForm
        onBack={() => setView("dashboard")}
        onSuccess={() => {
          setView("dashboard");
          loadData();
          showToast("Invitation sent!");
        }}
      />
    );
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <DashboardView
        stats={stats}
        orgName={orgName}
        loading={loading}
        onAddMember={() => setView("add")}
      />
    </>
  );
}