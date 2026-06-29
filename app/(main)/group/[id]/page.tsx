"use client";
import React, { useState, useEffect, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { Member, OrgGroup, MEMBER_TYPE_LABELS, MEMBER_TYPE_ICONS } from "@/utils/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const Toast = ({ msg, type }: { msg: string; type: "success" | "error" }) => (
  <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
    {msg}
  </div>
);

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
  </div>
);

// ─── Add Member to Group Modal ────────────────────────────────────────────────

const AddMemberModal = ({
  groupId,
  allMembers,
  currentMemberIds,
  onClose,
  onAdded,
}: {
  groupId: number;
  allMembers: Member[];
  currentMemberIds: Set<number>;
  onClose: () => void;
  onAdded: (member: Member) => void;
}) => {
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<number | null>(null);
  const [error, setError] = useState("");

  const available = allMembers.filter(
    (m) =>
      !currentMemberIds.has(m.id) &&
      m.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (member: Member) => {
    const token = getToken(); if (!token) return;
    setAdding(member.id); setError("");
    try {
      await api.addMemberToGroup(token, member.id, groupId);
      onAdded(member);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to add member."); }
    finally { setAdding(null); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Add Member to Group</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        {error && <p className="text-sm text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 flex-shrink-0">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
            className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {available.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {allMembers.length === 0 ? "No members in organisation yet." : "All members already in this group."}
            </p>
          ) : available.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg flex-shrink-0">{MEMBER_TYPE_ICONS[m.member_type]}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400">{MEMBER_TYPE_LABELS[m.member_type]}</p>
                </div>
              </div>
              <button
                onClick={() => handleAdd(m)}
                disabled={adding === m.id}
                className="flex-shrink-0 ml-3 bg-violet-400 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {adding === m.id ? "Adding…" : "+ Add"}
              </button>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 w-full py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors">
          Done
        </button>
      </div>
    </div>
  );
};

// ─── Row Action Menu ──────────────────────────────────────────────────────────

const RowAction = ({
  member,
  onView,
  onRemove,
}: {
  member: Member;
  onView: () => void;
  onRemove: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 bg-violet-400 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
        ⚙ ACTION ▾
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
          <button onClick={() => { setOpen(false); onView(); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            View Profile
          </button>
          <button onClick={() => { setOpen(false); onRemove(); }} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
            Remove from Group
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const groupId = parseInt(id);

  const [group, setGroup] = useState<OrgGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const [showAddModal, setShowAddModal] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const [groupsData, membersData, allMembersData] = await Promise.all([
        api.getGroups(token),
        api.getMembers(token, { group_id: groupId }),
        api.getMembers(token),
      ]);
      const found = groupsData.find((g) => g.id === groupId);
      setGroup(found ?? null);
      setMembers(membersData);
      setAllMembers(allMembersData);
    } catch { showToast("Failed to load group data.", "error"); }
    finally { setLoading(false); }
  }, [groupId, router]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async () => {
    if (!removeTarget) return;
    const token = getToken(); if (!token) return;
    try {
      await api.removeMemberFromGroup(token, removeTarget.id, groupId);
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      setRemoveTarget(null);
      showToast(`${removeTarget.name} removed from group.`);
    } catch { showToast("Failed to remove member.", "error"); }
  };

  const handleMemberAdded = (member: Member) => {
    setMembers((prev) => [...prev, member]);
    showToast(`${member.name} added to group.`);
  };

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const currentIds = new Set(members.map((m) => m.id));

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Remove confirm */}
      {removeTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 mb-2">Remove from Group</h3>
            <p className="text-sm text-gray-600 mb-5">
              Remove <strong>{removeTarget.name}</strong> from this group? The member account will not be deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRemoveTarget(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleRemove} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Add member modal */}
      {showAddModal && (
        <AddMemberModal
          groupId={groupId}
          allMembers={allMembers}
          currentMemberIds={currentIds}
          onClose={() => setShowAddModal(false)}
          onAdded={handleMemberAdded}
        />
      )}

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <button onClick={() => router.push("/group")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
            ← Back to Groups
          </button>

          {loading ? <Spinner /> : !group ? (
            <div className="text-center py-24">
              <p className="text-gray-500 mb-4">Group not found.</p>
              <button onClick={() => router.push("/group")} className="text-violet-500 hover:text-violet-700 text-sm font-medium">← Back to Groups</button>
            </div>
          ) : (
            <>
              {/* Group Header */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-800">{group.name}</h1>
                    {group.description && (
                      <p className="text-gray-500 mt-1">{group.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full">
                        👥 {members.length} member{members.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow"
                  >
                    + ADD MEMBER TO GROUP
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <h2 className="text-base font-semibold text-gray-700">Group Members</h2>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 w-64">
                    <input
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      placeholder="Search members…"
                      className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                    />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 flex-shrink-0">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-violet-400 text-white">
                        {["MEMBER NAME", "TYPE", "MAIN SPORT", "EMAIL", "JOINED", "ACTION"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold tracking-wider first:rounded-l-xl last:rounded-r-xl">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-gray-400">
                            {members.length === 0 ? "No members in this group yet." : "No members match your search."}
                          </td>
                        </tr>
                      ) : paginated.map((m, i) => (
                        <tr key={m.id} className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                          <td className="px-4 py-3">
                            <button onClick={() => router.push(`/organisation/members/${m.user_id}`)} className="flex items-center gap-2 text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors text-left">
                              <span className="text-base">{MEMBER_TYPE_ICONS[m.member_type]}</span>
                              {m.name}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-violet-100 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">
                              {MEMBER_TYPE_LABELS[m.member_type]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{m.main_sports?.[0] ?? "—"}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{m.email || "—"}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{fmt(m.created_at)}</td>
                          <td className="px-4 py-3">
                            <RowAction
                              member={m}
                              onView={() => router.push(`/organisation/members/${m.user_id}`)}
                              onRemove={() => setRemoveTarget(m)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
                    <p className="text-sm text-gray-500">
                      Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
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
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}