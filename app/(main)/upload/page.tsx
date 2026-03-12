"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { api, ApiError } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { FolderNode } from "@/utils/types/index";

// ── Types ──────────────────────────────────────────────────

interface FileItem {
  file: File;
  id: string; // local key
  progress: number; // 0-100
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

// ── Helpers ────────────────────────────────────────────────

const formatSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const ACCEPTED = ".mp4,.mov,.avi,.mkv,.wmv,.flv,.webm,.m4v,.mpg,.mpeg";
const VIDEO_TYPES = ACCEPTED.split(",").map((e) => e.replace(".", ""));

// ── Component ──────────────────────────────────────────────

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [flatFolders, setFlatFolders] = useState<FolderNode[]>([]);
  const [selectedFolderID, setSelectedFolderID] = useState<number | null>(null);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  // New folder creation
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentID, setNewFolderParentID] = useState<number | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);

  const token = getToken() ?? "";

  // Fetch folder tree
  const fetchFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const data = await api.getFolders(token);
      setFlatFolders(data.flat ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoadingFolders(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const addFiles = (incoming: File[]) => {
    const valid = incoming.filter((f) => f.type.startsWith("video/"));
    const items: FileItem[] = valid.map((f) => ({
      file: f,
      id: `${f.name}-${f.size}-${Math.random()}`,
      progress: 0,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...items]);
  };

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const updateFile = (id: string, patch: Partial<FileItem>) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  // Create folder inline
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    try {
      await api.createFolder(token, {
        name: newFolderName.trim(),
        parent_id: newFolderParentID,
      });
      setNewFolderName("");
      setShowNewFolder(false);
      await fetchFolders();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to create folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  // Upload all pending files
  const handleUpload = async () => {
    const pending = files.filter((f) => f.status === "pending");
    if (!pending.length) return;
    setIsUploading(true);

    for (const item of pending) {
      updateFile(item.id, { status: "uploading", progress: 0 });
      try {
        // 1. Get presigned URL + create DB record
        const presign = await api.presignUpload(token, {
          filename: item.file.name,
          content_type: item.file.type || "video/mp4",
          size: item.file.size,
          folder_id: selectedFolderID,
        });

        // 2. PUT directly to S3 with progress
        await api.uploadToS3(presign.upload_url, item.file, (pct) => {
          updateFile(item.id, { progress: pct });
        });

        updateFile(item.id, { status: "done", progress: 100 });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        updateFile(item.id, { status: "error", error: msg });
      }
    }
    setIsUploading(false);
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const doneCount = files.filter((f) => f.status === "done").length;
  const allDone = files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");

  const statusIcon = (f: FileItem) => {
    if (f.status === "done") return (
      <span className="text-emerald-500">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
    if (f.status === "error") return (
      <span className="text-red-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
    if (f.status === "uploading") return (
      <svg className="animate-spin text-blue-500" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
        <path d="M12 3a9 9 0 019 9" />
      </svg>
    );
    return null;
  };

  return (
    <div className="flex items-center justify-center min-h-full p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-3xl w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 md:p-10 border border-gray-100 space-y-8">

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-1">Upload Videos</h2>
            <p className="text-gray-500 text-sm">Import and manage content</p>
          </div>

          {/* ── Folder selector ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">Upload to folder</label>
              <button
                onClick={() => setShowNewFolder((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New folder
              </button>
            </div>

            {/* New folder form */}
            {showNewFolder && (
              <div className="flex flex-col sm:flex-row gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <select
                  value={newFolderParentID ?? "root"}
                  onChange={(e) => setNewFolderParentID(e.target.value === "root" ? null : Number(e.target.value))}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-600"
                >
                  <option value="root">Root (no parent)</option>
                  {flatFolders.map((f) => (
                    <option key={f.id} value={f.id}>{f.full_path}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 placeholder-gray-400"
                />
                <button
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim() || creatingFolder}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {creatingFolder ? "Creating…" : "Create"}
                </button>
                <button
                  onClick={() => setShowNewFolder(false)}
                  className="px-3 py-2 text-gray-400 hover:text-gray-600 text-sm"
                >Cancel</button>
              </div>
            )}

            {/* Folder dropdown */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                </svg>
              </span>
              <select
                value={selectedFolderID ?? "root"}
                onChange={(e) => setSelectedFolderID(e.target.value === "root" ? null : Number(e.target.value))}
                disabled={loadingFolders}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-700 appearance-none cursor-pointer disabled:opacity-60"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                }}
              >
                <option value="root">Root (no folder)</option>
                {flatFolders.map((f) => (
                  <option key={f.id} value={f.id}>{f.full_path}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Drop zone ── */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              multiple
              onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
              className="hidden"
            />
            <div className="flex flex-col items-center pointer-events-none">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-1">
                {isDragging ? "Drop your videos here" : "Drag & drop videos"}
              </p>
              <p className="text-gray-400 text-sm mb-4">or click to browse</p>
              <p className="text-xs text-gray-400">
                {VIDEO_TYPES.join(", ").toUpperCase()}
              </p>
            </div>
          </div>

          {/* ── File list ── */}
          {files.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">
                  {doneCount > 0
                    ? `${doneCount} / ${files.length} uploaded`
                    : `${files.length} file${files.length !== 1 ? "s" : ""} selected`}
                </h3>
                {!isUploading && (
                  <button
                    onClick={() => setFiles([])}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {files.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    {/* Info + progress */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{formatSize(item.file.size)}</span>
                        {item.status === "error" && (
                          <span className="text-xs text-red-400">{item.error}</span>
                        )}
                      </div>
                      {(item.status === "uploading" || item.status === "done") && (
                        <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              item.status === "done" ? "bg-emerald-400" : "bg-blue-500"
                            }`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Status / remove */}
                    <div className="flex-shrink-0">
                      {statusIcon(item) ?? (
                        <button
                          onClick={() => removeFile(item.id)}
                          disabled={item.status === "uploading"}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload button */}
              {!allDone && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading || pendingCount === 0}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
                        <path d="M12 3a9 9 0 019 9" />
                      </svg>
                      Uploading…
                    </>
                  ) : (
                    `Upload ${pendingCount} ${pendingCount === 1 ? "video" : "videos"}`
                  )}
                </button>
              )}

              {allDone && (
                <div className="flex items-center justify-center gap-2 py-3 text-emerald-600 font-medium text-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  All uploads complete
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}