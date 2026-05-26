"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import {
  Member,
  OrgGroup,
  MemberType,
  ALL_MEMBER_TYPES,
  MEMBER_TYPE_LABELS,
  MEMBER_TYPE_ICONS,
  PREDEFINED_SPORTS,
  GENDERS,
  CreateMemberRequest,
  UpdateMemberRequest,
} from "@/utils/types";
import { createPortal } from "react-dom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Shared mini-components ───────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
  </div>
);

const Toast = ({ msg, type }: { msg: string; type: "success" | "error" }) => (
  <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
    {msg}
  </div>
);

const FormField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3">
    <label className="text-sm text-gray-600 sm:w-40 flex-shrink-0">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="flex-1">{children}</div>
  </div>
);

const FieldInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className="w-full bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none" />
);

const FieldSelect = ({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none appearance-none">
    <option value="">{placeholder}</option>
    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

// ─── Form state ───────────────────────────────────────────────────────────────

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
  memberType: "", name: "", email: "", dob: "", gender: "",
  phone: "", mainSport: "", otherSport: "", height: "", weight: "",
  armSpan: "", legLength: "", shoeSize: "",
  otherMetrics: [{ name: "", value: "" }], groupId: "",
});

const memberToForm = (m: Member): FormState => ({
  memberType: m.member_type,
  name: m.name,
  email: m.email,
  dob: m.date_of_birth ? m.date_of_birth.substring(0, 10) : "",
  gender: m.gender,
  phone: m.phone_no,
  mainSport: m.main_sports?.[0] ?? "",
  otherSport: m.other_sports?.[0] ?? "",
  height: m.height != null ? String(m.height) : "",
  weight: m.weight != null ? String(m.weight) : "",
  armSpan: m.arm_span != null ? String(m.arm_span) : "",
  legLength: m.leg_length != null ? String(m.leg_length) : "",
  shoeSize: m.shoe_size != null ? String(m.shoe_size) : "",
  otherMetrics: Object.entries(m.other_metrics ?? {}).map(([n, v]) => ({ name: n, value: String(v) })).concat([{ name: "", value: "" }]),
  groupId: "",
});

// ─── Member form (shared by Add & Edit) ──────────────────────────────────────

const MemberForm = ({
  initial,
  groups,
  onBack,
  onSubmit,
  title,
  submitLabel,
  submitting,
  error,
}: {
  initial: FormState;
  groups: OrgGroup[];
  onBack: () => void;
  onSubmit: (f: FormState) => void;
  title: string;
  submitLabel: string;
  submitting: boolean;
  error: string;
}) => {
  const [form, setForm] = useState<FormState>(initial);
  const set = (field: keyof FormState, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const typeOptions = ALL_MEMBER_TYPES.map((t) => ({ value: t, label: MEMBER_TYPE_LABELS[t] }));
  const sportOptions = PREDEFINED_SPORTS.map((s) => ({ value: s, label: s }));
  const genderOptions = GENDERS.map((g) => ({ value: g, label: g }));
  const groupOptions = groups.map((g) => ({ value: String(g.id), label: g.name }));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
          ← Back to list
        </button>
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">{title}</h1>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{error}</div>}

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="mb-6">
            <FormField label="Member type:" required>
              <FieldSelect value={form.memberType} onChange={(v) => set("memberType", v)} options={typeOptions} placeholder="Select member type" />
            </FormField>
          </div>

          {/* Personal Profile */}
          <div className="relative border border-gray-200 rounded-2xl p-6 mb-6">
            <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">Personal Profile</span>
            <div className="divide-y divide-gray-50">
              <FormField label="Name:" required>
                <FieldInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" />
              </FormField>
              <FormField label="Email Address:">
                <FieldInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="Email address" />
              </FormField>
              <FormField label="Date of Birth:">
                <FieldInput type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
              </FormField>
              <FormField label="Gender:">
                <FieldSelect value={form.gender} onChange={(v) => set("gender", v)} options={genderOptions} placeholder="Select gender" />
              </FormField>
              <FormField label="Phone No:">
                <FieldInput value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Phone number" />
              </FormField>
              <FormField label="Main Sports:">
                <FieldSelect value={form.mainSport} onChange={(v) => set("mainSport", v)} options={sportOptions} placeholder="Select main sport" />
              </FormField>
              <FormField label="Other Sports:">
                <FieldSelect value={form.otherSport} onChange={(v) => set("otherSport", v)} options={sportOptions} placeholder="Select other sport" />
              </FormField>
            </div>
          </div>

          {/* Physical Profile */}
          <div className="relative border border-gray-200 rounded-2xl p-6 mb-6">
            <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">Physical Profile</span>
            <div className="divide-y divide-gray-50">
              <FormField label="Group / Team:">
                <FieldSelect value={form.groupId} onChange={(v) => set("groupId", v)} options={groupOptions} placeholder={groups.length ? "Select group" : "No groups yet"} />
              </FormField>
              {[
                { key: "height", label: "Height:", unit: "cm" },
                { key: "weight", label: "Weight:", unit: "kg" },
                { key: "armSpan", label: "Arm Span:", unit: "cm" },
                { key: "legLength", label: "Leg Length:", unit: "cm" },
              ].map((f) => (
                <FormField key={f.key} label={f.label}>
                  <div className="flex items-center gap-2">
                    <FieldInput type="number" min="0" step="0.1" value={form[f.key as keyof FormState] as string} onChange={(e) => set(f.key as keyof FormState, e.target.value)} placeholder="Enter value" />
                    <span className="text-sm text-gray-500 flex-shrink-0 w-8">{f.unit}</span>
                  </div>
                </FormField>
              ))}
              <FormField label="Shoe Size:">
                <div className="flex items-center gap-2">
                  <FieldInput type="number" min="0" step="0.5" value={form.shoeSize} onChange={(e) => set("shoeSize", e.target.value)} placeholder="Size" />
                  <span className="text-sm text-gray-500 flex-shrink-0">cm</span>
                </div>
              </FormField>
            </div>
          </div>

          {/* Other Metrics */}
          <div className="relative border border-gray-200 rounded-2xl p-6 mb-8">
            <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">Other Metrics</span>
            <div className="space-y-3">
              {form.otherMetrics.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 flex-shrink-0">{i + 1}.</span>
                  <input value={m.name} onChange={(e) => { const u = [...form.otherMetrics]; u[i].name = e.target.value; setForm((p) => ({ ...p, otherMetrics: u })); }} placeholder="Metric name" className="flex-1 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none" />
                  <input value={m.value} onChange={(e) => { const u = [...form.otherMetrics]; u[i].value = e.target.value; setForm((p) => ({ ...p, otherMetrics: u })); }} placeholder="Value" className="w-28 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none" />
                  {i === form.otherMetrics.length - 1 && (
                    <button onClick={() => setForm((p) => ({ ...p, otherMetrics: [...p.otherMetrics, { name: "", value: "" }] }))} className="text-xs text-blue-500 hover:text-blue-700 font-medium flex-shrink-0">+ Add</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <button onClick={() => onSubmit(form)} disabled={submitting} className="bg-violet-400 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow">
              {submitting ? "Saving…" : submitLabel}
            </button>
            <button onClick={() => setForm(initial)} className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow">RESET</button>
            <button onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow">CANCEL</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Manage Groups Modal ──────────────────────────────────────────────────────

const ManageGroupsModal = ({
  member,
  groups,
  onClose,
  onUpdate,
}: {
  member: Member;
  groups: OrgGroup[];
  onClose: () => void;
  onUpdate: (updated: Member) => void;
}) => {
  const [currentGroups, setCurrentGroups] = useState<OrgGroup[]>(member.groups ?? []);
  const [addGroupId, setAddGroupId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const currentIds = new Set(currentGroups.map((g) => g.id));
  const available = groups.filter((g) => !currentIds.has(g.id));

  const remove = async (groupId: number) => {
    const token = getToken(); if (!token) return;
    setBusy(true); setErr("");
    try {
      await api.removeMemberFromGroup(token, member.id, groupId);
      const updated = await api.getMember(token, member.id);
      setCurrentGroups(updated.groups ?? []);
      onUpdate(updated);
    } catch { setErr("Failed to remove from group."); }
    finally { setBusy(false); }
  };

  const add = async () => {
    if (!addGroupId) return;
    const token = getToken(); if (!token) return;
    setBusy(true); setErr("");
    try {
      await api.addMemberToGroup(token, member.id, parseInt(addGroupId));
      const updated = await api.getMember(token, member.id);
      setCurrentGroups(updated.groups ?? []);
      onUpdate(updated);
      setAddGroupId("");
    } catch { setErr("Failed to add to group."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Manage Groups — {member.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        {err && <p className="text-sm text-red-500 mb-3">{err}</p>}

        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Current Groups</p>
        {currentGroups.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">Not in any groups.</p>
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {currentGroups.map((g) => (
              <span key={g.id} className="flex items-center gap-1.5 bg-violet-100 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full">
                {g.name}
                <button onClick={() => remove(g.id)} disabled={busy} className="hover:text-red-500 transition-colors">✕</button>
              </span>
            ))}
          </div>
        )}

        {available.length > 0 && (
          <>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium">Add to Group</p>
            <div className="flex gap-2">
              <select value={addGroupId} onChange={(e) => setAddGroupId(e.target.value)} className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none">
                <option value="">Select group…</option>
                {available.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <button onClick={add} disabled={busy || !addGroupId} className="bg-violet-400 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Add</button>
            </div>
          </>
        )}

        <button onClick={onClose} className="mt-5 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors">Done</button>
      </div>
    </div>
  );
};

// ─── Action Menu ──────────────────────────────────────────────────────────────

const ActionMenu = ({
  member,
  onView,
  onEdit,
  onDelete,
  onManageGroups,
}: {
  member: Member;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageGroups: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // Close on scroll so menu doesn't float away from button
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener("scroll", h, true);
    return () => window.removeEventListener("scroll", h, true);
  }, [open]);

  const handleOpen = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX,
    });
    setOpen((o) => !o);
  };

  const item = (label: string, cb: () => void, danger = false) => (
    <button
      key={label}
      onClick={() => { setOpen(false); cb(); }}
      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
        danger ? "text-red-500 hover:bg-red-50" : "text-gray-700"
      }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className="flex items-center gap-1.5 bg-violet-400 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        ⚙ ACTION ▾
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "absolute",
              top: menuPos.top,
              left: menuPos.left,
              transform: "translateX(-100%)", // right-aligns menu to button
              zIndex: 9999,
            }}
            className="w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden"
          >
            {item("View Profile", onView)}
            {item("Edit", onEdit)}
            {item("Manage Groups", onManageGroups)}
            {item("Delete", onDelete, true)}
          </div>,
          document.body
        )}
    </>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type PageView = "list" | "add" | "edit";

export default function MembersListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<PageView>("list");
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [manageGroupsMember, setManageGroupsMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") ?? "");
  const [groupFilter, setGroupFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const [membersData, groupsData] = await Promise.all([
        api.getMembers(token),
        api.getGroups(token),
      ]);
      setMembers(membersData);
      setGroups(groupsData);
    } catch { showToast("Failed to load members", "error"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  // Client-side filtering
  const filtered = members.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || m.member_type === typeFilter;
    const matchGroup = !groupFilter || m.groups?.some((g) => String(g.id) === groupFilter);
    return matchSearch && matchType && matchGroup;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // ── Handlers ──────────────────────────────────────────────

  const buildPayload = (f: FormState): CreateMemberRequest => {
    const otherMetrics = f.otherMetrics
      .filter((m) => m.name.trim())
      .reduce<Record<string, string>>((acc, m) => { acc[m.name.trim()] = m.value; return acc; }, {});
    return {
      member_type: f.memberType as MemberType,
      name: f.name.trim(),
      email: f.email || undefined,
      date_of_birth: f.dob ? `${f.dob}T00:00:00Z` : undefined,
      gender: f.gender || undefined,
      phone_no: f.phone || undefined,
      main_sports: f.mainSport ? [f.mainSport] : [],
      other_sports: f.otherSport ? [f.otherSport] : [],
      height: f.height ? parseFloat(f.height) : undefined,
      weight: f.weight ? parseFloat(f.weight) : undefined,
      arm_span: f.armSpan ? parseFloat(f.armSpan) : undefined,
      leg_length: f.legLength ? parseFloat(f.legLength) : undefined,
      shoe_size: f.shoeSize ? parseFloat(f.shoeSize) : undefined,
      other_metrics: Object.keys(otherMetrics).length ? otherMetrics : undefined,
      group_ids: f.groupId ? [parseInt(f.groupId)] : [],
    };
  };

  const handleAdd = async (f: FormState) => {
    if (!f.memberType) { setFormError("Member type is required."); return; }
    if (!f.name.trim()) { setFormError("Name is required."); return; }
    const token = getToken(); if (!token) return;
    setSubmitting(true); setFormError("");
    try {
      await api.createMember(token, buildPayload(f));
      await loadData();
      setView("list");
      showToast("Member added successfully!");
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Failed to add member."); }
    finally { setSubmitting(false); }
  };

  const handleEdit = async (f: FormState) => {
    if (!editingMember) return;
    if (!f.name.trim()) { setFormError("Name is required."); return; }
    const token = getToken(); if (!token) return;
    setSubmitting(true); setFormError("");
    try {
      const p = buildPayload(f);
      const upd: UpdateMemberRequest = {
        member_type: p.member_type,
        name: p.name,
        email: p.email,
        date_of_birth: p.date_of_birth ?? null,
        gender: p.gender,
        phone_no: p.phone_no,
        main_sports: p.main_sports,
        other_sports: p.other_sports,
        height: p.height ?? null,
        weight: p.weight ?? null,
        arm_span: p.arm_span ?? null,
        leg_length: p.leg_length ?? null,
        shoe_size: p.shoe_size ?? null,
        other_metrics: p.other_metrics,
      };
      await api.updateMember(token, editingMember.id, upd);
      // Handle group assignment if changed
      if (f.groupId) {
        const alreadyIn = editingMember.groups?.some((g) => String(g.id) === f.groupId);
        if (!alreadyIn) await api.addMemberToGroup(token, editingMember.id, parseInt(f.groupId));
      }
      await loadData();
      setView("list");
      setEditingMember(null);
      showToast("Member updated successfully!");
    } catch (err: unknown) { setFormError(err instanceof Error ? err.message : "Failed to update member."); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = getToken(); if (!token) return;
    try {
      await api.deleteMember(token, deleteTarget.id);
      setDeleteTarget(null);
      await loadData();
      showToast("Member deleted.");
    } catch { showToast("Failed to delete member.", "error"); }
  };

  // ── Render ────────────────────────────────────────────────

  if (view === "add") {
    return <MemberForm initial={emptyForm()} groups={groups} onBack={() => { setView("list"); setFormError(""); }} onSubmit={handleAdd} title="Add Member" submitLabel="ADD" submitting={submitting} error={formError} />;
  }

  if (view === "edit" && editingMember) {
    return <MemberForm initial={memberToForm(editingMember)} groups={groups} onBack={() => { setView("list"); setEditingMember(null); setFormError(""); }} onSubmit={handleEdit} title="Edit Member" submitLabel="SAVE" submitting={submitting} error={formError} />;
  }

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 mb-2">Delete Member</h3>
            <p className="text-sm text-gray-600 mb-5">Remove <strong>{deleteTarget.name}</strong> permanently? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Manage groups modal */}
      {manageGroupsMember && (
        <ManageGroupsModal
          member={manageGroupsMember}
          groups={groups}
          onClose={() => setManageGroupsMember(null)}
          onUpdate={(updated) => {
            setMembers((prev) => prev.map((m) => m.id === updated.id ? updated : m));
          }}
        />
      )}

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-light text-gray-800 text-center mb-6">My Organisation — Members</h1>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            {/* Top toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <button onClick={() => { setView("add"); setFormError(""); }} className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow">
                + ADD NEW MEMBER
              </button>
              <button onClick={loadData} className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow">
                ↻ REFRESH
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or email…"
                className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-300">
                <option value="">All types</option>
                {ALL_MEMBER_TYPES.map((t) => <option key={t} value={t}>{MEMBER_TYPE_LABELS[t]}</option>)}
              </select>
              <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-300">
                <option value="">All groups</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* Table */}
            {loading ? <Spinner /> : (
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-violet-400 text-white">
                      {["CREATED", "NAME", "TYPE", "GROUPS", "ACTION"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold tracking-wider first:rounded-l-xl last:rounded-r-xl">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-gray-400">No members found</td></tr>
                    ) : paginated.map((m, i) => (
                      <tr key={m.id} className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 text-gray-500 text-xs">{fmt(m.created_at)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => router.push(`/organisation/members/${m.id}`)} className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors text-left">
                            <span className="mr-2">{MEMBER_TYPE_ICONS[m.member_type]}</span>{m.name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-violet-100 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            {MEMBER_TYPE_LABELS[m.member_type]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {m.groups?.length ? m.groups.map((g) => g.name).join(", ") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <ActionMenu
                            member={m}
                            onView={() => router.push(`/organisation/members/${m.id}`)}
                            onEdit={() => { setEditingMember(m); setView("edit"); setFormError(""); }}
                            onDelete={() => setDeleteTarget(m)}
                            onManageGroups={() => setManageGroupsMember(m)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
              <p className="text-sm text-gray-500">
                {filtered.length === 0 ? "No results" : `Showing ${(page - 1) * perPage + 1}–${Math.min(page * perPage, filtered.length)} of ${filtered.length}`}
              </p>
              <div className="flex items-center gap-1">
                {[
                  { label: "«", action: () => setPage(1) },
                  { label: "‹", action: () => setPage((p) => Math.max(1, p - 1)) },
                  { label: "›", action: () => setPage((p) => Math.min(totalPages, p + 1)) },
                  { label: "»", action: () => setPage(totalPages) },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} className="w-9 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-sm text-gray-500">
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}