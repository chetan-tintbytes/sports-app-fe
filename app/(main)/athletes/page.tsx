"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { Member, OrgGroup, MEMBER_TYPE_ICONS } from "@/utils/types";
import { createPortal } from "react-dom";

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

// ─── Action Menu ──────────────────────────────────────────────────────────────

const ActionMenu = ({
  member,
  onView,
  onDelete,
  onManageGroups,
}: {
  member: Member;
  onView: () => void;
  onDelete: () => void;
  onManageGroups: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
              transform: "translateX(-100%)",
              zIndex: 9999,
            }}
            className="w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden"
          >
            {item("View Profile", onView)}
            {item("Edit", () => { setOpen(false); onView(); })}
            {item("Manage Groups", onManageGroups)}
            {item("Delete", onDelete, true)}
          </div>,
          document.body
        )}
    </>
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
  onUpdate: (m: Member) => void;
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
    } catch { setErr("Failed to remove."); }
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
    } catch { setErr("Failed to add."); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Groups — {member.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        {err && <p className="text-sm text-red-500 mb-3">{err}</p>}
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Current Groups</p>
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
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Add to Group</p>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AthletesPage() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Member[]>([]);
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 25;
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [manageGroupsMember, setManageGroupsMember] = useState<Member | null>(null);
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
      const [athletesData, groupsData] = await Promise.all([
        api.getMembers(token, { type: "athlete" }),
        api.getGroups(token),
      ]);
      setAthletes(athletesData);
      setGroups(groupsData);
    } catch { showToast("Failed to load athletes.", "error"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const filtered = athletes.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchGroup = !groupFilter || a.groups?.some((g) => String(g.id) === groupFilter);
    return matchSearch && matchGroup;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = getToken(); if (!token) return;
    try {
      await api.deleteMember(token, deleteTarget.id);
      setDeleteTarget(null);
      await load();
      showToast("Athlete deleted.");
    } catch { showToast("Failed to delete.", "error"); }
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 mb-2">Delete Athlete</h3>
            <p className="text-sm text-gray-600 mb-5">Remove <strong>{deleteTarget.name}</strong> permanently?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {manageGroupsMember && (
        <ManageGroupsModal
          member={manageGroupsMember}
          groups={groups}
          onClose={() => setManageGroupsMember(null)}
          onUpdate={(updated) => setAthletes((prev) => prev.map((a) => a.id === updated.id ? updated : a))}
        />
      )}

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-light text-gray-800 text-center mb-6">My Athletes</h1>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <button
                onClick={() => router.push("/organisation/list")}
                className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow"
              >
                + ADD NEW ATHLETE
              </button>
              <button onClick={load} className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow">
                ↻ REFRESH
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-2 border border-gray-200 rounded-full px-4 py-2.5 bg-gray-50 flex-1 min-w-[200px] max-w-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400 flex-shrink-0">
                  <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
                </svg>
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search athlete name…" className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" />
              </div>
              <select value={groupFilter} onChange={(e) => { setGroupFilter(e.target.value); setPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-300">
                <option value="">All groups</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            {/* Stats badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-violet-100 text-violet-700 text-xs font-semibold px-3 py-1 rounded-full">
                {MEMBER_TYPE_ICONS.athlete} {athletes.length} athlete{athletes.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Table */}
            {loading ? <Spinner /> : (
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-violet-400 text-white">
                      {["CREATION DATE", "ATHLETE NAME", "MAIN SPORT", "GROUPS", "ACTION"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold tracking-wider first:rounded-l-xl last:rounded-r-xl">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-12 text-gray-400">No athletes found</td></tr>
                    ) : paginated.map((a, i) => (
                      <tr key={a.id} className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3 text-gray-500 text-xs">{fmt(a.created_at)}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => router.push(`/organisation/members/${a.id}`)} className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors">
                            {a.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{a.main_sports?.[0] ?? "—"}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {a.groups?.length ? a.groups.map((g) => g.name).join(", ") : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <ActionMenu
                            member={a}
                            onView={() => router.push(`/organisation/members/${a.id}`)}
                            onDelete={() => setDeleteTarget(a)}
                            onManageGroups={() => setManageGroupsMember(a)}
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
              <select value={perPage} className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-300" >
                <option value={25}>25</option>
              </select>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                {[
                  { label: "«««", action: () => setPage(1) },
                  { label: "«", action: () => setPage((p) => Math.max(1, p - 1)) },
                  { label: "»", action: () => setPage((p) => Math.min(totalPages, p + 1)) },
                  { label: "»»»", action: () => setPage(totalPages) },
                ].map((btn, i) => (
                  <button key={i} onClick={btn.action} className="w-9 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-xs font-medium">
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