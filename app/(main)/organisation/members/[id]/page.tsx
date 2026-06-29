"use client";
import React, { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
// next/image not used — presigned S3 URLs use plain <img> to avoid caching issues
import { api } from "@/utils/lib/api";
import { getToken, getIsAdmin } from "@/utils/lib/auth";
import {
  Member,
  OrgGroup,
  MEMBER_TYPE_LABELS,
  MEMBER_TYPE_ICONS,
  PREDEFINED_SPORTS,
  GENDERS,
  UpdateMemberRequest,
} from "@/utils/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const Toast = ({ msg, type }: { msg: string; type: "success" | "error" }) => (
  <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
    {msg}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-24">
    <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="relative border border-gray-200 rounded-2xl p-6 mb-6">
    <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">{title}</span>
    {children}
  </div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs text-gray-400 uppercase tracking-wide sm:w-40 flex-shrink-0 pt-0.5">{label}</span>
    <span className="text-sm text-gray-800">{value || "—"}</span>
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

const EditFormField = ({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-gray-50 last:border-0">
    <label className="text-xs text-gray-500 uppercase tracking-wide sm:w-40 flex-shrink-0">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="flex-1">{children}</div>
  </div>
);

// ─── Edit state ───────────────────────────────────────────────────────────────

interface EditState {
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
}

const memberToEdit = (m: Member): EditState => ({
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
  otherMetrics: [
    ...Object.entries(m.other_metrics ?? {}).map(([n, v]) => ({ name: n, value: String(v) })),
    { name: "", value: "" },
  ],
});

// ─── Groups Panel ─────────────────────────────────────────────────────────────

const GroupsPanel = ({
  member,
  groups,
  onUpdate,
  showToast,
  isAdmin,
}: {
  member: Member;
  groups: OrgGroup[];
  onUpdate: (m: Member) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  isAdmin: boolean;
}) => {
  const [addGroupId, setAddGroupId] = useState("");
  const [busy, setBusy] = useState(false);
  const currentIds = new Set((member.groups ?? []).map((g) => g.id));
  const available = groups.filter((g) => !currentIds.has(g.id));

  const remove = async (groupId: number) => {
    const token = getToken(); if (!token) return;
    setBusy(true);
    try {
      await api.removeMemberFromGroup(token, member.user_id, groupId);
      const updated = await api.getMember(token, member.user_id);
      onUpdate(updated);
      showToast("Removed from group.");
    } catch { showToast("Failed to remove from group.", "error"); }
    finally { setBusy(false); }
  };

  const add = async () => {
    if (!addGroupId) return;
    const token = getToken(); if (!token) return;
    setBusy(true);
    try {
      await api.addMemberToGroup(token, member.user_id, parseInt(addGroupId));
      const updated = await api.getMember(token, member.user_id);
      onUpdate(updated);
      setAddGroupId("");
      showToast("Added to group.");
    } catch { showToast("Failed to add to group.", "error"); }
    finally { setBusy(false); }
  };

  return (
    <Section title="Groups">
      {(member.groups ?? []).length === 0 ? (
        <p className="text-sm text-gray-400 mb-4">Not assigned to any groups.</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-4">
          {(member.groups ?? []).map((g) => (
            <span key={g.id} className="flex items-center gap-1.5 bg-violet-100 text-violet-700 text-xs font-medium px-3 py-1.5 rounded-full">
              {g.name}
              {isAdmin && (
                <button onClick={() => remove(g.id)} disabled={busy} className="hover:text-red-500 transition-colors leading-none">✕</button>
              )}
            </span>
          ))}
        </div>
      )}
      {isAdmin && available.length > 0 && (
        <div className="flex gap-2 mt-2">
          <select value={addGroupId} onChange={(e) => setAddGroupId(e.target.value)} className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none">
            <option value="">Add to group…</option>
            {available.map((g) => <option key={g.id} value={g.id}>{g.name} ({g.member_count} members)</option>)}
          </select>
          <button onClick={add} disabled={busy || !addGroupId} className="bg-violet-400 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Add</button>
        </div>
      )}
    </Section>
  );
};

// ─── Profile Image Section ────────────────────────────────────────────────────

const ProfileImageSection = ({
  member,
  onUpdate,
  showToast,
  isAdmin,
}: {
  member: Member;
  onUpdate: (m: Member) => void;
  showToast: (msg: string, type?: "success" | "error") => void;
  isAdmin: boolean;
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const ALLOWED = ["image/png", "image/gif", "image/bmp", "image/jpeg"];

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED.includes(file.type)) { showToast("Only PNG, GIF, BMP, JPG/JPEG allowed.", "error"); return; }
    const token = getToken(); if (!token) return;
    setUploading(true); setProgress(0);
    try {
      const { upload_url, key } = await api.presignMemberProfileImage(token, member.user_id, {
        content_type: file.type,
        filename: `profile_${Date.now()}`,
      });
      await api.uploadToS3(upload_url, file, setProgress);
      const updated = await api.updateMember(token, member.user_id, { profile_image_key: key });
      onUpdate(updated);
      showToast("Profile image updated!");
    } catch { showToast("Failed to upload image.", "error"); }
    finally { setUploading(false); setProgress(0); }
    e.target.value = "";
  };

  return (
    <Section title="Profile Image">
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-200">
          {member.profile_image_url ? (
            <img src={member.profile_image_url} alt={member.name} className="object-cover w-full h-full" />
          ) : (
            <span className="text-3xl">{MEMBER_TYPE_ICONS[member.member_type as keyof typeof MEMBER_TYPE_ICONS]}</span>
          )}
        </div>
        {isAdmin && (
          <div>
            <label className={`cursor-pointer inline-flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors ${uploading ? "opacity-60 pointer-events-none" : ""}`}>
              {uploading ? `Uploading ${progress}%…` : "📷 Upload Photo"}
              <input type="file" accept=".png,.gif,.bmp,.jpg,.jpeg" className="hidden" onChange={handleFile} disabled={uploading} />
            </label>
            <p className="text-xs text-gray-400 mt-1.5">PNG, GIF, BMP, JPG/JPEG · Min 250×150 px</p>
            {uploading && (
              <div className="mt-2 h-1.5 w-40 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const memberId = parseInt(id);
  const isAdmin = getIsAdmin();

  const [member, setMember] = useState<Member | null>(null);
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMember = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const [memberData, groupsData] = await Promise.all([
        api.getMember(token, memberId),
        api.getGroups(token),
      ]);
      setMember(memberData);
      setGroups(groupsData);
    } catch { showToast("Failed to load member.", "error"); }
    finally { setLoading(false); }
  }, [memberId, router]);

  useEffect(() => { loadMember(); }, [loadMember]);

  const enterEdit = () => {
    if (!member) return;
    setEditState(memberToEdit(member));
    setEditMode(true);
    setEditError("");
  };

  const cancelEdit = () => { setEditMode(false); setEditError(""); };

  const setField = (field: keyof EditState, value: string) =>
    setEditState((prev) => prev ? { ...prev, [field]: value } : prev);

  const handleSave = async () => {
    if (!editState || !member) return;
    if (!editState.name.trim()) { setEditError("Name is required."); return; }
    const token = getToken(); if (!token) return;
    setSaving(true); setEditError("");
    try {
      const otherMetrics = editState.otherMetrics
        .filter((m) => m.name.trim())
        .reduce<Record<string, string>>((acc, m) => { acc[m.name.trim()] = m.value; return acc; }, {});

      // Update sports/physical profile data (user_profiles table)
      const upd: UpdateMemberRequest = {
        date_of_birth: editState.dob ? `${editState.dob}T00:00:00Z` : null,
        gender: editState.gender || undefined,
        phone_no: editState.phone || undefined,
        main_sports: editState.mainSport ? [editState.mainSport] : [],
        other_sports: editState.otherSport ? [editState.otherSport] : [],
        height: editState.height ? parseFloat(editState.height) : null,
        weight: editState.weight ? parseFloat(editState.weight) : null,
        arm_span: editState.armSpan ? parseFloat(editState.armSpan) : null,
        leg_length: editState.legLength ? parseFloat(editState.legLength) : null,
        shoe_size: editState.shoeSize ? parseFloat(editState.shoeSize) : null,
        other_metrics: Object.keys(otherMetrics).length ? otherMetrics : {},
      };

      // Update name/email on the users table via the admin endpoint
      await Promise.all([
        api.updateMember(token, member.user_id, upd),
        api.adminUpdateUser(token, member.user_id, {
          name: editState.name.trim(),
          email: editState.email || undefined,
        }),
      ]);

      // Reload the full profile so the page reflects both updates
      const updated = await api.getMember(token, member.user_id);
      setMember(updated);
      setEditMode(false);
      showToast("Profile updated!");
    } catch (err: unknown) { setEditError(err instanceof Error ? err.message : "Failed to update."); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!member) return;
    const token = getToken(); if (!token) return;
    try {
      await api.deleteOrgUser(token, member.user_id);
      router.push("/organisation/list");
    } catch { showToast("Failed to delete member.", "error"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto"><Spinner /></div>
    </div>
  );

  if (!member) return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">Member not found.</p>
        <button onClick={() => router.push("/organisation/list")} className="text-violet-500 hover:text-violet-700 text-sm font-medium">← Back to list</button>
      </div>
    </div>
  );

  const sportOptions = PREDEFINED_SPORTS.map((s) => ({ value: s, label: s }));
  const genderOptions = GENDERS.map((g) => ({ value: g, label: g }));

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 mb-2">Delete Member</h3>
            <p className="text-sm text-gray-600 mb-5">Remove <strong>{member.name}</strong> permanently? This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <button onClick={() => router.push("/organisation/list")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
            ← Back to Member List
          </button>

          {/* Header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {member.is_admin
                  ? "👑"
                  : (MEMBER_TYPE_ICONS[member.member_type as keyof typeof MEMBER_TYPE_ICONS] ?? "👤")}
              </span>
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">{member.name}</h1>
                <span className={`inline-block mt-0.5 text-xs font-medium px-2.5 py-1 rounded-full ${member.is_admin ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700"}`}>
                  {member.is_admin
                    ? "Admin"
                    : (MEMBER_TYPE_LABELS[member.member_type as keyof typeof MEMBER_TYPE_LABELS] ?? member.role_name ?? "Member")}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && !editMode && (
                <>
                  <button onClick={enterEdit} className="bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow">
                    ✏ EDIT
                  </button>
                  <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors">
                    🗑 DELETE
                  </button>
                </>
              )}
              {isAdmin && editMode && (
                <>
                  <button onClick={handleSave} disabled={saving} className="bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow">
                    {saving ? "Saving…" : "✓ SAVE"}
                  </button>
                  <button onClick={cancelEdit} className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors">
                    CANCEL
                  </button>
                </>
              )}
            </div>
          </div>

          {editError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">{editError}</div>
          )}

          {/* Profile Image */}
          <ProfileImageSection member={member} onUpdate={setMember} showToast={showToast} isAdmin={isAdmin} />

          {/* Personal Profile */}
          {!editMode ? (
            <Section title="Personal Profile">
              <Row label="Name" value={member.name} />
              <Row label="Email" value={member.email} />
              <Row label="Date of Birth" value={fmt(member.date_of_birth)} />
              <Row label="Gender" value={member.gender} />
              <Row label="Phone" value={member.phone_no} />
              <Row label="Main Sport" value={member.main_sports?.join(", ")} />
              <Row label="Other Sports" value={member.other_sports?.join(", ")} />
            </Section>
          ) : editState && (
            <Section title="Personal Profile">
              <EditFormField label="Name" required>
                <FieldInput value={editState.name} onChange={(e) => setField("name", e.target.value)} placeholder="Full name" />
              </EditFormField>
              <EditFormField label="Email">
                <FieldInput type="email" value={editState.email} onChange={(e) => setField("email", e.target.value)} placeholder="Email" />
              </EditFormField>
              <EditFormField label="Date of Birth">
                <FieldInput type="date" value={editState.dob} onChange={(e) => setField("dob", e.target.value)} />
              </EditFormField>
              <EditFormField label="Gender">
                <FieldSelect value={editState.gender} onChange={(v) => setField("gender", v)} options={genderOptions} placeholder="Select gender" />
              </EditFormField>
              <EditFormField label="Phone">
                <FieldInput value={editState.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="Phone" />
              </EditFormField>
              <EditFormField label="Main Sport">
                <FieldSelect value={editState.mainSport} onChange={(v) => setField("mainSport", v)} options={sportOptions} placeholder="Select sport" />
              </EditFormField>
              <EditFormField label="Other Sport">
                <FieldSelect value={editState.otherSport} onChange={(v) => setField("otherSport", v)} options={sportOptions} placeholder="Select sport" />
              </EditFormField>
            </Section>
          )}

          {/* Physical Profile */}
          {!editMode ? (
            <Section title="Physical Profile">
              <Row label="Height" value={member.height != null ? `${member.height} cm` : null} />
              <Row label="Weight" value={member.weight != null ? `${member.weight} kg` : null} />
              <Row label="Arm Span" value={member.arm_span != null ? `${member.arm_span} cm` : null} />
              <Row label="Leg Length" value={member.leg_length != null ? `${member.leg_length} cm` : null} />
              <Row label="Shoe Size" value={member.shoe_size != null ? `${member.shoe_size} cm` : null} />
            </Section>
          ) : editState && (
            <Section title="Physical Profile">
              {[
                { key: "height", label: "Height", unit: "cm" },
                { key: "weight", label: "Weight", unit: "kg" },
                { key: "armSpan", label: "Arm Span", unit: "cm" },
                { key: "legLength", label: "Leg Length", unit: "cm" },
              ].map((f) => (
                <EditFormField key={f.key} label={f.label}>
                  <div className="flex items-center gap-2">
                    <FieldInput type="number" min="0" step="0.1" value={editState[f.key as keyof EditState] as string} onChange={(e) => setField(f.key as keyof EditState, e.target.value)} placeholder="Enter value" />
                    <span className="text-sm text-gray-500 w-8 flex-shrink-0">{f.unit}</span>
                  </div>
                </EditFormField>
              ))}
              <EditFormField label="Shoe Size">
                <div className="flex items-center gap-2">
                  <FieldInput type="number" min="0" step="0.5" value={editState.shoeSize} onChange={(e) => setField("shoeSize", e.target.value)} placeholder="Size" />
                  <span className="text-sm text-gray-500 w-8 flex-shrink-0">cm</span>
                </div>
              </EditFormField>
            </Section>
          )}

          {/* Other Metrics */}
          {!editMode && Object.keys(member.other_metrics ?? {}).length > 0 && (
            <Section title="Other Metrics">
              {Object.entries(member.other_metrics).map(([k, v]) => (
                <Row key={k} label={k} value={String(v)} />
              ))}
            </Section>
          )}

          {editMode && editState && (
            <Section title="Other Metrics">
              <div className="space-y-3">
                {editState.otherMetrics.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 flex-shrink-0">{i + 1}.</span>
                    <input value={m.name} onChange={(e) => { const u = [...editState.otherMetrics]; u[i].name = e.target.value; setEditState((p) => p ? { ...p, otherMetrics: u } : p); }} placeholder="Metric name" className="flex-1 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none" />
                    <input value={m.value} onChange={(e) => { const u = [...editState.otherMetrics]; u[i].value = e.target.value; setEditState((p) => p ? { ...p, otherMetrics: u } : p); }} placeholder="Value" className="w-28 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none" />
                    {i === editState.otherMetrics.length - 1 && (
                      <button onClick={() => setEditState((p) => p ? { ...p, otherMetrics: [...p.otherMetrics, { name: "", value: "" }] } : p)} className="text-xs text-blue-500 hover:text-blue-700 font-medium flex-shrink-0">+ Add</button>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Groups (always visible, independent of edit mode) */}
          <GroupsPanel member={member} groups={groups} onUpdate={setMember} showToast={showToast} isAdmin={isAdmin} />

          {/* Meta */}
          <div className="mt-4 flex gap-6 text-xs text-gray-400">
            <span>Member ID: #{member.id}</span>
            <span>Created: {fmt(member.created_at)}</span>
            <span>Updated: {fmt(member.updated_at)}</span>
          </div>
        </div>
      </div>
    </>
  );
}