"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "");
function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

interface Role { id: number; name: string; is_custom: boolean; created_at: string; }

export default function AdminRolesPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Create
  const [newRoleName, setNewRoleName] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadRoles = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/roles`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 403) { router.push("/dashboard"); return; }
      if (res.ok) setRoles(await res.json());
    } catch {
      showToast("Failed to load roles", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const predefined = roles.filter((r) => !r.is_custom);
  const custom = roles.filter((r) => r.is_custom);

  const handleCreate = async () => {
    const name = newRoleName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/admin/roles`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to create role");
      showToast(`Role "${d.name}" created`);
      setNewRoleName("");
      loadRoles();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingRole) return;
    const name = editName.trim();
    if (!name) return;
    setEditSaving(true);
    try {
      const res = await fetch(`${API}/admin/roles/${editingRole.id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ name }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to update role");
      showToast("Role updated");
      setEditingRole(null);
      loadRoles();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (r: Role) => {
    if (!confirm(`Delete custom role "${r.name}"? Users assigned this role will lose their role assignment.`)) return;
    try {
      const res = await fetch(`${API}/admin/roles/${r.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to delete role");
      showToast(`Role "${r.name}" deleted`);
      loadRoles();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          toast.type === "success"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">Roles</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Manage roles that can be assigned to members of your organisation.
          Predefined roles cannot be modified or deleted.
        </p>
      </div>

      {/* Edit modal */}
      {editingRole && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a2035] rounded-2xl border border-white/10 p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Rename Role</h2>
              <button onClick={() => setEditingRole(null)} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
              placeholder="Role name"
              className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingRole(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={editSaving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                {editSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading roles…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Predefined roles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold">Predefined Roles</h2>
              <span className="bg-white/5 text-slate-400 text-xs px-2 py-0.5 rounded-full">{predefined.length}</span>
            </div>
            <p className="text-slate-500 text-xs">Built-in roles — cannot be renamed or deleted.</p>
            <div className="space-y-2">
              {predefined.map((r) => (
                <div key={r.id}
                  className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400/60" />
                    <span className="text-white text-sm font-medium">{r.name}</span>
                  </div>
                  <span className="text-slate-600 text-xs">predefined</span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom roles */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-white font-semibold">Custom Roles</h2>
              <span className="bg-white/5 text-slate-400 text-xs px-2 py-0.5 rounded-full">{custom.length}</span>
            </div>
            <p className="text-slate-500 text-xs">Roles you've created — can be renamed or deleted.</p>

            {/* Create new */}
            <div className="flex gap-2">
              <input
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="New role name…"
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newRoleName.trim()}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                {creating ? "…" : "+ Add"}
              </button>
            </div>

            <div className="space-y-2">
              {custom.length === 0 ? (
                <div className="text-center py-8 text-slate-600 text-sm border border-dashed border-white/10 rounded-xl">
                  No custom roles yet
                </div>
              ) : (
                custom.map((r) => (
                  <div key={r.id}
                    className="flex items-center justify-between bg-white/3 border border-white/5 hover:border-white/10 rounded-xl px-4 py-3 group transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-violet-400/60" />
                      <span className="text-white text-sm font-medium">{r.name}</span>
                      <span className="text-violet-400/60 text-xs">custom</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingRole(r); setEditName(r.name); }}
                        className="text-xs bg-white/5 hover:bg-white/15 text-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}