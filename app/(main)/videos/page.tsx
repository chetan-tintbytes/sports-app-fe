"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { Folder, Video, FolderNode } from "@/utils/types/index";

// ── Format helpers ──────────────────────────────────────────

const formatSize = (bytes: number) => {
  if (!bytes) return "—";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ── Small reusable icons ────────────────────────────────────

const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

// ── Context-menu (three-dot) dropdown ──────────────────────

function ItemMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-50 w-44 bg-white border border-gray-100 rounded-xl shadow-xl py-1 overflow-hidden">
          {React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
                  onClick: () => { setOpen(false); (child.props as { onClick?: () => void }).onClick?.(); },
                })
              : child
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  label,
  icon,
  danger,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
        danger
          ? "text-red-500 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Modal ──────────────────────────────────────────────────

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Folder card ────────────────────────────────────────────

function FolderCard({
  folder,
  onClick,
  onRename,
  onMove,
  onDelete,
}: {
  folder: Folder;
  onClick: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group relative z-10 hover:z-50 flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-gray-100 hover:border-blue-200 hover:shadow-lg rounded-2xl p-4 cursor-pointer transition-all duration-200"
    >
      {/* Folder icon */}
      <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
          {folder.name}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(folder.created_at)}</p>
      </div>
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ItemMenu>
          <MenuItem label="Rename" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>} onClick={onRename} />
          <MenuItem label="Move" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>} onClick={onMove} />
          <MenuItem label="Delete" danger icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>} onClick={onDelete} />
        </ItemMenu>
      </div>
    </div>
  );
}

// ── Video card ─────────────────────────────────────────────

const FORMAT_COLORS: Record<string, string> = {
  mp4: "bg-blue-500",
  mov: "bg-purple-500",
  avi: "bg-rose-500",
  mkv: "bg-indigo-500",
  webm: "bg-teal-500",
};

function VideoCard({
  video,
  onClick,
  onRename,
  onMove,
  onDelete,
}: {
  video: Video;
  onClick: () => void;
  onRename: () => void;
  onMove: () => void;
  onDelete: () => void;
}) {
  const fmtColor = FORMAT_COLORS[video.format?.toLowerCase()] ?? "bg-gray-500";

  return (
    <div
      onClick={onClick}
      className="group relative z-10 hover:z-50 bg-white/70 backdrop-blur-sm border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-0.5 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
    >
      {/* Thumbnail area */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round">
          <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
          </div>
        </div>
        {/* Format badge */}
        <span className={`absolute top-2 left-2.5 ${fmtColor} text-white text-[10px] font-bold rounded-md px-2 py-0.5 uppercase tracking-wide`}>
          {video.format || "—"}
        </span>
        {/* Menu */}
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <ItemMenu>
            <MenuItem label="Rename" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>} onClick={onRename} />
            <MenuItem label="Move to…" icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="5 9 2 12 5 15" /><polyline points="9 5 12 2 15 5" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="12" y1="2" x2="12" y2="22" /></svg>} onClick={onMove} />
            <MenuItem label="Delete" danger icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>} onClick={onDelete} />
          </ItemMenu>
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors mb-1.5">
          {video.original_name}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{formatSize(video.size)}</span>
          <span>{formatDate(video.uploaded_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────

interface BreadcrumbEntry {
  id: number | "root";
  name: string;
}

type ModalState =
  | { type: "none" }
  | { type: "rename-folder"; folder: Folder }
  | { type: "rename-video"; video: Video }
  | { type: "move-folder"; folder: Folder }
  | { type: "move-video"; video: Video }
  | { type: "delete-folder"; folder: Folder }
  | { type: "delete-video"; video: Video }
  | { type: "new-folder" };

export default function AllVideosPage() {
  const router = useRouter();
  const token = getToken() ?? "";

  const [folders, setFolders] = useState<Folder[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [flatFolders, setFlatFolders] = useState<FolderNode[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([{ id: "root", name: "My Files" }]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  // Input state for modals
  const [inputVal, setInputVal] = useState("");
  const [selectedTargetID, setSelectedTargetID] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const currentFolderID = breadcrumbs[breadcrumbs.length - 1].id;

  // ── Data fetching ────────────────────────────────────────

  const fetchContents = useCallback(async (folderID: number | "root") => {
    setLoading(true);
    try {
      const data = await api.getFolderContents(token, folderID);
      setFolders(data.folders ?? []);
      setVideos(data.videos ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchFlatFolders = useCallback(async () => {
    try {
      const data = await api.getFolders(token);
      setFlatFolders(data.flat ?? []);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    fetchContents(currentFolderID);
    fetchFlatFolders();
  }, [currentFolderID, fetchContents, fetchFlatFolders]);

  // ── Navigation ───────────────────────────────────────────

  const openFolder = (folder: Folder) => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const navigateTo = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  // ── Filtered results ─────────────────────────────────────

  const q = search.toLowerCase();
  const filteredFolders = folders.filter((f) => f.name.toLowerCase().includes(q));
  const filteredVideos = videos.filter((v) => v.original_name.toLowerCase().includes(q));

  // ── Modal actions ────────────────────────────────────────

  const openModal = (m: ModalState) => {
    setModal(m);
    setInputVal(
      m.type === "rename-folder" ? m.folder.name :
      m.type === "rename-video" ? m.video.original_name : ""
    );
    setSelectedTargetID(null);
  };

  const closeModal = () => {
    setModal({ type: "none" });
    setInputVal("");
    setSelectedTargetID(null);
    setActionLoading(false);
  };

  const handleRenameFolder = async () => {
    if (modal.type !== "rename-folder") return;
    setActionLoading(true);
    try {
      await api.renameFolder(token, modal.folder.id, inputVal.trim());
      await fetchContents(currentFolderID);
      closeModal();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to rename");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenameVideo = async () => {
    if (modal.type !== "rename-video") return;
    setActionLoading(true);
    try {
      await api.renameVideo(token, modal.video.id, inputVal.trim());
      await fetchContents(currentFolderID);
      closeModal();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to rename");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveFolder = async () => {
    if (modal.type !== "move-folder") return;
    setActionLoading(true);
    try {
      await api.moveFolder(token, modal.folder.id, selectedTargetID);
      await fetchContents(currentFolderID);
      await fetchFlatFolders();
      closeModal();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to move folder");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveVideo = async () => {
    if (modal.type !== "move-video") return;
    setActionLoading(true);
    try {
      await api.moveVideo(token, modal.video.id, selectedTargetID);
      await fetchContents(currentFolderID);
      closeModal();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to move video");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (modal.type !== "delete-folder") return;
    setActionLoading(true);
    try {
      await api.deleteFolder(token, modal.folder.id);
      await fetchContents(currentFolderID);
      await fetchFlatFolders();
      closeModal();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete folder");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (modal.type !== "delete-video") return;
    setActionLoading(true);
    try {
      await api.deleteVideo(token, modal.video.id);
      await fetchContents(currentFolderID);
      closeModal();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to delete video");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!inputVal.trim()) return;
    setActionLoading(true);
    try {
      await api.createFolder(token, {
        name: inputVal.trim(),
        parent_id: currentFolderID === "root" ? null : currentFolderID,
      });
      await fetchContents(currentFolderID);
      await fetchFlatFolders();
      closeModal();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to create folder");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Move picker — exclude the folder being moved itself ──

  const movableFolders = (excludeID?: number) =>
    flatFolders.filter((f) => f.id !== excludeID);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">All Videos</h1>
          <p className="text-gray-500 text-sm">
            {folders.length} folder{folders.length !== 1 ? "s" : ""} · {videos.length} video{videos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Toolbar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm text-gray-700 placeholder-gray-400 transition-all"
            />
          </div>

          {/* New folder */}
          <button
            onClick={() => openModal({ type: "new-folder" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm text-gray-600 font-medium transition-all hover:border-gray-300 hover:shadow-sm whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Folder
          </button>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 flex-wrap text-sm">
          {breadcrumbs.map((crumb, i) => {
            const isLast = i === breadcrumbs.length - 1;
            return (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-gray-300">/</span>}
                <button
                  onClick={() => navigateTo(i)}
                  disabled={isLast}
                  className={`px-2 py-0.5 rounded-lg transition-colors ${
                    isLast
                      ? "text-gray-800 font-semibold cursor-default"
                      : "text-blue-500 hover:text-blue-600 hover:bg-blue-50 font-medium"
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <svg className="animate-spin text-blue-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
              <path d="M12 3a9 9 0 019 9" />
            </svg>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Folders */}
            {filteredFolders.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                  Folders
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredFolders.map((folder) => (
                    <FolderCard
                      key={folder.id}
                      folder={folder}
                      onClick={() => openFolder(folder)}
                      onRename={() => openModal({ type: "rename-folder", folder })}
                      onMove={() => openModal({ type: "move-folder", folder })}
                      onDelete={() => openModal({ type: "delete-folder", folder })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {filteredVideos.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
                  Videos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onClick={() => router.push(`/videos/details?id=${video.id}`)}
                      onRename={() => openModal({ type: "rename-video", video })}
                      onMove={() => openModal({ type: "move-video", video })}
                      onDelete={() => openModal({ type: "delete-video", video })}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {filteredFolders.length === 0 && filteredVideos.length === 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  {search ? "No results found" : "This folder is empty"}
                </h3>
                <p className="text-sm text-gray-400">
                  {search ? "Try a different search term" : "Upload videos or create a folder to get started"}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-4 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────── */}

      {/* New Folder */}
      {modal.type === "new-folder" && (
        <Modal title="New Folder" onClose={closeModal}>
          <input
            autoFocus
            type="text"
            placeholder="Folder name"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4 placeholder-gray-400"
          />
          <div className="flex gap-2">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={handleCreateFolder}
              disabled={!inputVal.trim() || actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold transition-colors"
            >
              {actionLoading ? "Creating…" : "Create"}
            </button>
          </div>
        </Modal>
      )}

      {/* Rename Folder */}
      {modal.type === "rename-folder" && (
        <Modal title="Rename Folder" onClose={closeModal}>
          <input
            autoFocus
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameFolder()}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
          />
          <div className="flex gap-2">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={handleRenameFolder}
              disabled={!inputVal.trim() || actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold transition-colors"
            >
              {actionLoading ? "Saving…" : "Save"}
            </button>
          </div>
        </Modal>
      )}

      {/* Rename Video */}
      {modal.type === "rename-video" && (
        <Modal title="Rename Video" onClose={closeModal}>
          <input
            autoFocus
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRenameVideo()}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
          />
          <div className="flex gap-2">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={handleRenameVideo}
              disabled={!inputVal.trim() || actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold transition-colors"
            >
              {actionLoading ? "Saving…" : "Save"}
            </button>
          </div>
        </Modal>
      )}

      {/* Move Folder */}
      {modal.type === "move-folder" && (
        <Modal title={`Move "${modal.folder.name}" to…`} onClose={closeModal}>
          <select
            value={selectedTargetID ?? "root"}
            onChange={(e) => setSelectedTargetID(e.target.value === "root" ? null : Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4 appearance-none"
          >
            <option value="root">Root (no folder)</option>
            {movableFolders(modal.folder.id).map((f) => (
              <option key={f.id} value={f.id}>{f.full_path}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={handleMoveFolder}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold transition-colors"
            >
              {actionLoading ? "Moving…" : "Move"}
            </button>
          </div>
        </Modal>
      )}

      {/* Move Video */}
      {modal.type === "move-video" && (
        <Modal title={`Move "${modal.video.original_name}" to…`} onClose={closeModal}>
          <select
            value={selectedTargetID ?? "root"}
            onChange={(e) => setSelectedTargetID(e.target.value === "root" ? null : Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4 appearance-none"
          >
            <option value="root">Root (no folder)</option>
            {flatFolders.map((f) => (
              <option key={f.id} value={f.id}>{f.full_path}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={handleMoveVideo}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold transition-colors"
            >
              {actionLoading ? "Moving…" : "Move"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Folder */}
      {modal.type === "delete-folder" && (
        <Modal title="Delete Folder" onClose={closeModal}>
          <p className="text-sm text-gray-600 mb-1">
            Delete <span className="font-semibold text-gray-800">{modal.folder.name}</span>?
          </p>
          <p className="text-xs text-red-400 mb-5">
            This will permanently delete all subfolders and videos inside it from S3 and cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={handleDeleteFolder}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold transition-colors"
            >
              {actionLoading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete Video */}
      {modal.type === "delete-video" && (
        <Modal title="Delete Video" onClose={closeModal}>
          <p className="text-sm text-gray-600 mb-1">
            Delete <span className="font-semibold text-gray-800">{modal.video.original_name}</span>?
          </p>
          <p className="text-xs text-red-400 mb-5">
            This will permanently remove the file from S3 and cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              onClick={handleDeleteVideo}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold transition-colors"
            >
              {actionLoading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}