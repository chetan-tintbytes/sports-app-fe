"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "");

function authHeaders() {
  return { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` };
}

interface Role { id: number; name: string; is_custom: boolean; }
interface User {
  id: number; name: string; email: string; is_admin: boolean;
  role_id: number | null; role_name: string; status: string;
  created_at: string;
}
interface Invitation {
  id: number; name: string; email: string; role_name: string;
  invite_link?: string; expires_at: string; accepted_at: string | null; created_at: string;
}

type Tab = "members" | "invitations";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  invited: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  inactive: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("members");
  const [users, setUsers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [invEmail, setInvEmail] = useState("");
  const [invName, setInvName] = useState("");
  const [invRoleID, setInvRoleID] = useState<number | "">("");
  const [inviting, setInviting] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  // Edit user
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRoleID, setEditRoleID] = useState<number | "">("");
  const [editStatus, setEditStatus] = useState("");
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/auth/login"); return; }
    setLoading(true);
    try {
      const [usersRes, invRes, rolesRes] = await Promise.all([
        fetch(`${API}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/admin/invitations`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/admin/roles`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (usersRes.status === 403) { router.push("/dashboard"); return; }
      setUsers(usersRes.ok ? await usersRes.json() : []);
      setInvitations(invRes.ok ? await invRes.json() : []);
      setRoles(rolesRes.ok ? await rolesRes.json() : []);
    } catch {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Invite ──────────────────────────────────────────────────────────────────
  const handleInvite = async () => {
    if (!invEmail || !invName || !invRoleID) {
      showToast("Please fill in all fields", "error");
      return;
    }
    setInviting(true);
    try {
      const res = await fetch(`${API}/admin/invitations`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: invEmail, name: invName, role_id: invRoleID }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to send invite");
      setLastInviteLink(d.invite_link);
      setInvEmail(""); setInvName(""); setInvRoleID("");
      setShowInviteForm(false);
      showToast(d.email_warning ? "Invite created (email failed — copy link below)" : "Invitation sent successfully");
      loadData();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setInviting(false);
    }
  };

  // ── Edit user ────────────────────────────────────────────────────────────────
  const openEdit = (u: User) => {
    setEditUser(u);
    setEditRoleID(u.role_id ?? "");
    setEditStatus(u.status);
    setEditName(u.name);
  };

  const handleSaveUser = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const body: Record<string, any> = {};
      if (editName !== editUser.name) body.name = editName;
      if (editRoleID !== (editUser.role_id ?? "")) body.role_id = editRoleID;
      if (editStatus !== editUser.status) body.status = editStatus;

      const res = await fetch(`${API}/admin/users/${editUser.id}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to update user");
      showToast("User updated");
      setEditUser(null);
      loadData();
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete user ──────────────────────────────────────────────────────────────
  const handleDelete = async (u: User) => {
    if (!confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/admin/users/${u.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to delete user");
      showToast("User deleted");
      loadData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  // ── Revoke invitation ────────────────────────────────────────────────────────
  const handleRevoke = async (inv: Invitation) => {
    if (!confirm(`Revoke invitation for ${inv.email}?`)) return;
    try {
      const res = await fetch(`${API}/admin/invitations/${inv.id}`, {
        method: "DELETE", headers: authHeaders(),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed to revoke");
      showToast("Invitation revoked");
      loadData();
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const members = users.filter((u) => !u.is_admin);

  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          toast.type === "success"
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border-red-500/20"
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white text-2xl font-bold">User Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your organisation's members and invitations</p>
        </div>
        <button
          onClick={() => { setShowInviteForm(true); setLastInviteLink(null); }}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v8m-4-4h8M4 12h8" /></svg>
          Invite Member
        </button>
      </div>

      {/* Last invite link banner */}
      {lastInviteLink && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <div className="text-amber-400 text-sm font-semibold">Invite link (share manually if email failed)</div>
          <div className="flex items-center gap-2">
            <input readOnly value={lastInviteLink}
              className="flex-1 bg-black/20 border border-white/10 text-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono truncate" />
            <button onClick={() => { navigator.clipboard.writeText(lastInviteLink); showToast("Copied!"); }}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
              Copy
            </button>
            <button onClick={() => setLastInviteLink(null)} className="text-slate-500 hover:text-slate-300 text-xs px-2">✕</button>
          </div>
        </div>
      )}

      {/* Invite form modal */}
      {showInviteForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a2035] rounded-2xl border border-white/10 p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Invite New Member</h2>
              <button onClick={() => setShowInviteForm(false)} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">Full Name</label>
                <input value={invName} onChange={(e) => setInvName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">Email Address</label>
                <input type="email" value={invEmail} onChange={(e) => setInvEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">Role</label>
                <select value={invRoleID} onChange={(e) => setInvRoleID(Number(e.target.value) || "")}
                  className="w-full bg-[#0f1623] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">Select a role…</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}{r.is_custom ? " (custom)" : ""}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowInviteForm(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleInvite} disabled={inviting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                {inviting ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {editUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a2035] rounded-2xl border border-white/10 p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Edit {editUser.name}</h2>
              <button onClick={() => setEditUser(null)} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors" />
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">Role</label>
                <select value={editRoleID} onChange={(e) => setEditRoleID(Number(e.target.value) || "")}
                  className="w-full bg-[#0f1623] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="">No role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}{r.is_custom ? " ✦" : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 text-sm font-medium block mb-1">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#0f1623] border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditUser(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-medium py-2.5 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveUser} disabled={saving}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {(["members", "invitations"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
            }`}>
            {t}
            {t === "members" && <span className="ml-2 text-xs opacity-70">{members.length}</span>}
            {t === "invitations" && <span className="ml-2 text-xs opacity-70">{invitations.filter(i => !i.accepted_at).length}</span>}
          </button>
        ))}
      </div>

      {/* Members table */}
      {tab === "members" && (
        loading ? (
          <div className="text-center py-16 text-slate-500">Loading…</div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">👥</div>
            <div className="text-slate-400">No members yet. Invite someone to get started.</div>
          </div>
        ) : (
          <div className="bg-[#1a2035] rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3.5">Member</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Role</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Joined</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {members.map((u, i) => (
                  <tr key={u.id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i === members.length - 1 ? "border-0" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">{u.name}</div>
                          <div className="text-slate-500 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-slate-300 text-sm">{u.role_name || <span className="text-slate-600 italic">No role</span>}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[u.status] ?? STATUS_COLORS.inactive}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(u)}
                          className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg transition-colors">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(u)}
                          className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Invitations table */}
      {tab === "invitations" && (
        loading ? (
          <div className="text-center py-16 text-slate-500">Loading…</div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-4xl">✉️</div>
            <div className="text-slate-400">No invitations yet.</div>
          </div>
        ) : (
          <div className="bg-[#1a2035] rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-5 py-3.5">Invitee</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Role</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Status</th>
                  <th className="text-left text-slate-400 text-xs font-semibold uppercase tracking-wider px-4 py-3.5">Expires</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv, i) => {
                  const expired = new Date(inv.expires_at) < new Date() && !inv.accepted_at;
                  return (
                    <tr key={inv.id} className={`border-b border-white/5 hover:bg-white/2 transition-colors ${i === invitations.length - 1 ? "border-0" : ""}`}>
                      <td className="px-5 py-4">
                        <div className="text-white text-sm font-medium">{inv.name}</div>
                        <div className="text-slate-500 text-xs">{inv.email}</div>
                      </td>
                      <td className="px-4 py-4 text-slate-300 text-sm">{inv.role_name}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          inv.accepted_at ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : expired ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {inv.accepted_at ? "Accepted" : expired ? "Expired" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-500 text-xs">
                        {new Date(inv.expires_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        {!inv.accepted_at && !expired && (
                          <button onClick={() => handleRevoke(inv)}
                            className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-colors">
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}