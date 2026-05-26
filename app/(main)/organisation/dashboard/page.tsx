"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import {
  MemberType,
  MemberStats,
  OrgGroup,
  ALL_MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
  MEMBER_TYPE_ICONS,
  PREDEFINED_SPORTS,
  GENDERS,
  CreateMemberRequest,
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

interface FormState {
  memberType: string;
  name: string;
  email: string;
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
  groupId: string;
}

const emptyForm = (): FormState => ({
  memberType: "",
  name: "",
  email: "",
  dob: "",
  gender: "",
  phone: "",
  mainSport: "",
  otherSport: "",
  height: "",
  weight: "",
  armSpan: "",
  legLength: "",
  shoeSize: "",
  otherMetrics: [{ name: "", value: "" }],
  groupId: "",
});

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

// ─── Add Member Form ──────────────────────────────────────────────────────────

const AddMemberForm = ({
  groups,
  onBack,
  onSuccess,
}: {
  groups: OrgGroup[];
  onBack: () => void;
  onSuccess: () => void;
}) => {
  const [form, setForm] = useState<FormState>(emptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.memberType) { setError("Member type is required."); return; }
    if (!form.name.trim()) { setError("Name is required."); return; }
    setError("");
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    try {
      const otherMetrics = form.otherMetrics
        .filter((m) => m.name.trim())
        .reduce<Record<string, string>>((acc, m) => {
          acc[m.name.trim()] = m.value;
          return acc;
        }, {});

      const payload: CreateMemberRequest = {
        member_type: form.memberType as MemberType,
        name: form.name.trim(),
        email: form.email || undefined,
        date_of_birth: form.dob ? `${form.dob}T00:00:00Z` : undefined,
        gender: form.gender || undefined,
        phone_no: form.phone || undefined,
        main_sports: form.mainSport ? [form.mainSport] : [],
        other_sports: form.otherSport ? [form.otherSport] : [],
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        arm_span: form.armSpan ? parseFloat(form.armSpan) : undefined,
        leg_length: form.legLength ? parseFloat(form.legLength) : undefined,
        shoe_size: form.shoeSize ? parseFloat(form.shoeSize) : undefined,
        other_metrics: Object.keys(otherMetrics).length ? otherMetrics : undefined,
        group_ids: form.groupId ? [parseInt(form.groupId)] : [],
      };

      await api.createMember(token, payload);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add member.");
    } finally {
      setSubmitting(false);
    }
  };

  const sportOptions = PREDEFINED_SPORTS.map((s) => ({ value: s, label: s }));
  const genderOptions = GENDERS.map((g) => ({ value: g, label: g }));
  const typeOptions = ALL_MEMBER_TYPES.map((t) => ({
    value: t,
    label: MEMBER_TYPE_LABELS[t],
  }));
  const groupOptions = groups.map((g) => ({ value: String(g.id), label: g.name }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">Add Member</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          {/* Member Type */}
          <div className="mb-6">
            <FormField label="Member type:" required>
              <Select
                value={form.memberType}
                onChange={(v) => set("memberType", v)}
                options={typeOptions}
                placeholder="Select member type"
              />
            </FormField>
          </div>

          {/* Personal Profile */}
          <div className="relative border border-gray-200 rounded-2xl p-6 mb-6">
            <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">
              Personal Profile
            </span>
            <div className="divide-y divide-gray-50">
              <FormField label="Name:" required>
                <Input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Full name"
                />
              </FormField>
              <FormField label="Email Address:">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="Email address"
                />
              </FormField>
              <FormField label="Date of Birth:">
                <Input
                  type="date"
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                />
              </FormField>
              <FormField label="Gender:">
                <Select
                  value={form.gender}
                  onChange={(v) => set("gender", v)}
                  options={genderOptions}
                  placeholder="Select gender"
                />
              </FormField>
              <FormField label="Phone No:">
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  placeholder="Phone number"
                />
              </FormField>
              <FormField label="Main Sports:">
                <Select
                  value={form.mainSport}
                  onChange={(v) => set("mainSport", v)}
                  options={sportOptions}
                  placeholder="Select main sport"
                />
              </FormField>
              <FormField label="Other Sports:">
                <Select
                  value={form.otherSport}
                  onChange={(v) => set("otherSport", v)}
                  options={sportOptions}
                  placeholder="Select other sport"
                />
              </FormField>
            </div>
          </div>

          {/* Physical Profile */}
          <div className="relative border border-gray-200 rounded-2xl p-6 mb-6">
            <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">
              Physical Profile
            </span>
            <div className="divide-y divide-gray-50">
              <FormField label="Group / Team:">
                <Select
                  value={form.groupId}
                  onChange={(v) => set("groupId", v)}
                  options={groupOptions}
                  placeholder={groups.length ? "Select group" : "No groups yet"}
                />
              </FormField>
              {[
                { key: "height", label: "Height:", unit: "cm" },
                { key: "weight", label: "Weight:", unit: "kg" },
                { key: "armSpan", label: "Arm Span:", unit: "cm" },
                { key: "legLength", label: "Leg Length:", unit: "cm" },
              ].map((f) => (
                <FormField key={f.key} label={f.label}>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={form[f.key as keyof FormState] as string}
                      onChange={(e) => set(f.key as keyof FormState, e.target.value)}
                      placeholder={`Enter value`}
                    />
                    <span className="text-sm text-gray-500 flex-shrink-0 w-8">{f.unit}</span>
                  </div>
                </FormField>
              ))}
              <FormField label="Shoe Size:">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.shoeSize}
                    onChange={(e) => set("shoeSize", e.target.value)}
                    placeholder="Size"
                  />
                  <span className="text-sm text-gray-500 flex-shrink-0">cm</span>
                </div>
              </FormField>
            </div>
          </div>

          {/* Other Metrics */}
          <div className="relative border border-gray-200 rounded-2xl p-6 mb-8">
            <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">
              Other Metrics
            </span>
            <div className="space-y-3">
              {form.otherMetrics.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 flex-shrink-0">{i + 1}.</span>
                  <input
                    value={m.name}
                    onChange={(e) => {
                      const updated = [...form.otherMetrics];
                      updated[i].name = e.target.value;
                      setForm((p) => ({ ...p, otherMetrics: updated }));
                    }}
                    placeholder="Metric name"
                    className="flex-1 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none"
                  />
                  <input
                    value={m.value}
                    onChange={(e) => {
                      const updated = [...form.otherMetrics];
                      updated[i].value = e.target.value;
                      setForm((p) => ({ ...p, otherMetrics: updated }));
                    }}
                    placeholder="Value"
                    className="w-28 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none"
                  />
                  {i === form.otherMetrics.length - 1 && (
                    <button
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          otherMetrics: [...p.otherMetrics, { name: "", value: "" }],
                        }))
                      }
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium flex-shrink-0"
                    >
                      + Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-violet-400 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow"
            >
              {submitting ? "Saving…" : "ADD"}
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
        groups={groups}
        onBack={() => setView("dashboard")}
        onSuccess={() => {
          setView("dashboard");
          loadData();
          showToast("Member added successfully!");
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