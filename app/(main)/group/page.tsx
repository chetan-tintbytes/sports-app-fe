"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { OrgGroup } from "@/utils/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

const GroupModal = ({
  existing,
  onClose,
  onSave,
}: {
  existing: OrgGroup | null; // null = create mode
  onClose: () => void;
  onSave: (g: OrgGroup) => void;
}) => {
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("Group name is required."); return; }
    const token = getToken(); if (!token) return;
    setSaving(true); setError("");
    try {
      const result = existing
        ? await api.updateGroup(token, existing.id, { name: name.trim(), description })
        : await api.createGroup(token, { name: name.trim(), description });
      onSave(result);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to save group."); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800">{existing ? "Edit Group" : "Add New Group"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        {error && <p className="text-sm text-red-500 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Team Alpha"
              className="w-full bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description (optional)"
              rows={3}
              className="w-full bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-violet-400 hover:bg-violet-500 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors shadow">
            {saving ? "Saving…" : existing ? "Save Changes" : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Action Menu ──────────────────────────────────────────────────────────────

import { createPortal } from "react-dom";

const ActionMenu = ({
  group,
  onView,
  onEdit,
  onDelete,
}: {
  group: OrgGroup;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
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

  // Close on scroll (so menu doesn't float away from button)
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
              transform: "translateX(-100%)", // right-align to button
              zIndex: 9999,
            }}
            className="w-44 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden"
          >
            {item("View Members", onView)}
            {item("Edit Group", onEdit)}
            {item("Delete Group", onDelete, true)}
          </div>,
          document.body
        )}
    </>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GroupsPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<OrgGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<OrgGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OrgGroup | null>(null);
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
      const data = await api.getGroups(token);
      setGroups(data);
    } catch { showToast("Failed to load groups.", "error"); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const start = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, filtered.length);

  const handleSaved = (saved: OrgGroup) => {
    if (editingGroup) {
      setGroups((prev) => prev.map((g) => g.id === saved.id ? saved : g));
      showToast("Group updated!");
    } else {
      setGroups((prev) => [...prev, saved]);
      showToast("Group created!");
    }
    setShowModal(false);
    setEditingGroup(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const token = getToken(); if (!token) return;
    try {
      await api.deleteGroup(token, deleteTarget.id);
      setGroups((prev) => prev.filter((g) => g.id !== deleteTarget.id));
      setDeleteTarget(null);
      showToast("Group deleted.");
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Failed to delete.", "error"); }
  };

  return (
    <>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Create / Edit modal */}
      {(showModal || editingGroup) && (
        <GroupModal
          existing={editingGroup}
          onClose={() => { setShowModal(false); setEditingGroup(null); }}
          onSave={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 mb-2">Delete Group</h3>
            <p className="text-sm text-gray-600 mb-1">Remove <strong>{deleteTarget.name}</strong>?</p>
            <p className="text-xs text-gray-400 mb-5">Members will NOT be deleted — only the group and its assignments are removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-light text-gray-800 text-center mb-6">My Groups</h1>

          {/* Add Group button */}
          <div className="flex justify-center mb-6">
            <button onClick={() => { setEditingGroup(null); setShowModal(true); }} className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-8 py-3.5 rounded-xl transition-colors shadow">
              + ADD NEW GROUP
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            {/* Controls */}
            <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select value={perPage} className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-300" >
                  <option value={10}>10</option>
                </select>
                <span>entries</span>
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 w-72">
                <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search groups…" className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400" />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="text-gray-400 flex-shrink-0">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>

            {/* Table */}
            {loading ? <Spinner /> : (
              <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-violet-400 text-white">
                      {["GROUP NAME", "DESCRIPTION", "MEMBERS", "ACTION"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold tracking-wider first:rounded-l-xl last:rounded-r-xl">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-12 text-gray-400 bg-gray-50/50">No groups found</td></tr>
                    ) : paginated.map((g, i) => (
                      <tr key={g.id} className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                        <td className="px-4 py-3">
                          <button onClick={() => router.push(`/group/${g.id}`)} className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors">
                            {g.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{g.description || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="bg-violet-100 text-violet-700 text-xs font-medium px-2.5 py-1 rounded-full">
                            {g.member_count} member{g.member_count !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ActionMenu
                            group={g}
                            onView={() => router.push(`/group/${g.id}`)}
                            onEdit={() => setEditingGroup(g)}
                            onDelete={() => setDeleteTarget(g)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
              <p className="text-sm text-gray-500">
                {filtered.length === 0 ? "No results" : `Showing ${start} to ${end} of ${filtered.length} entries`}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {[
                  { label: "FIRST", action: () => setPage(1), disabled: page === 1 },
                  { label: "PREVIOUS", action: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1 },
                  { label: "NEXT", action: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page >= totalPages },
                  { label: "LAST", action: () => setPage(totalPages), disabled: page >= totalPages },
                ].map((btn) => (
                  <button key={btn.label} onClick={btn.action} disabled={btn.disabled} className="px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium tracking-wide transition-colors text-xs">
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