"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/utils/lib/api";
import { getToken, getIsAdmin } from "@/utils/lib/auth";
import { Video } from "@/utils/types/index";

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

const FORMAT_COLORS: Record<string, string> = {
  mp4: "bg-blue-500",
  mov: "bg-purple-500",
  avi: "bg-rose-500",
  mkv: "bg-indigo-500",
  webm: "bg-teal-500",
};

const COLUMNS = ["FILENAME", "UPLOADED BY", "UPLOADED AT", "SIZE", "FORMAT", "ACTION"];
const PER_PAGE = 25;

export default function AllVideosPage() {
  const router = useRouter();
  const isAdmin = getIsAdmin();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [playLoadingId, setPlayLoadingId] = useState<number | null>(null);
  const [player, setPlayer] = useState<{ video: Video; url: string } | null>(null);

  // Members shouldn't reach this page — send them to their own videos.
  useEffect(() => {
    if (!isAdmin) router.replace("/videos/my-videos");
  }, [isAdmin, router]);

  // Debounce search → reset to first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const loadVideos = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await api.getAllOrgVideos(token, {
        page,
        page_size: PER_PAGE,
        search: debouncedSearch || undefined,
      });
      setVideos(res.data);
      setTotal(res.total);
      setTotalPages(Math.max(1, res.total_pages));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [router, page, debouncedSearch]);

  useEffect(() => {
    if (isAdmin) loadVideos();
  }, [isAdmin, loadVideos]);

  const handleDownload = async (video: Video) => {
    const token = getToken();
    if (!token) return;
    setDownloadingId(video.id);
    try {
      const { download_url } = await api.downloadOrgVideo(token, video.id);
      const a = document.createElement("a");
      a.href = download_url;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start download");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleWatch = async (video: Video) => {
    const token = getToken();
    if (!token) return;
    setPlayLoadingId(video.id);
    setError("");
    try {
      const { view_url } = await api.viewOrgVideo(token, video.id);
      setPlayer({ video, url: view_url });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to open video");
    } finally {
      setPlayLoadingId(null);
    }
  };

  // Close the player on Escape.
  useEffect(() => {
    if (!player) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPlayer(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">All Videos</h1>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <p className="text-sm text-gray-500">
              Every video uploaded across your organisation.
            </p>
            <button
              onClick={loadVideos}
              className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow"
            >
              ↻ REFRESH
            </button>
          </div>

          {/* Search */}
          <div className="mb-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name or uploader…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-400 text-white">
                  {COLUMNS.map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold tracking-wider first:rounded-l-xl last:rounded-r-xl whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="text-center py-14 text-gray-400">
                      Loading videos…
                    </td>
                  </tr>
                ) : videos.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="text-center py-14 text-gray-400">
                      {debouncedSearch ? "No videos match your search" : "No videos uploaded yet"}
                    </td>
                  </tr>
                ) : (
                  videos.map((v, i) => (
                    <tr
                      key={v.id}
                      className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                    >
                      <td className="px-4 py-3 max-w-xs truncate" title={v.original_name}>
                        <button
                          onClick={() => handleWatch(v)}
                          className="font-medium text-gray-800 hover:text-violet-600 hover:underline transition-colors text-left truncate max-w-full"
                        >
                          {v.original_name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {v.uploader_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 tabular-nums whitespace-nowrap">
                        {formatDate(v.uploaded_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatSize(v.size)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`${FORMAT_COLORS[v.format?.toLowerCase()] ?? "bg-gray-500"} text-white text-[10px] font-bold rounded-md px-2 py-0.5 uppercase tracking-wide`}>
                          {v.format || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleWatch(v)}
                            disabled={playLoadingId === v.id}
                            className="flex items-center gap-1.5 bg-violet-400 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5,3 19,12 5,21" />
                            </svg>
                            {playLoadingId === v.id ? "Opening…" : "Watch"}
                          </button>
                          <button
                            onClick={() => handleDownload(v)}
                            disabled={downloadingId === v.id}
                            className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            {downloadingId === v.id ? "Preparing…" : "Download"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              {total === 0 ? "No results" : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} of ${total}`}
            </p>
            <div className="flex items-center gap-1">
              {[
                { label: "«", action: () => setPage(1), disabled: page === 1 },
                { label: "‹", action: () => setPage((p) => Math.max(1, p - 1)), disabled: page === 1 },
                { label: "›", action: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: page >= totalPages },
                { label: "»", action: () => setPage(totalPages), disabled: page >= totalPages },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  className="w-9 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-30 transition-colors text-sm text-gray-500"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video player modal */}
      {player && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPlayer(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate" title={player.video.original_name}>
                  {player.video.original_name}
                </p>
                <p className="text-xs text-gray-400">
                  {player.video.uploader_name || "—"} · {formatDate(player.video.uploaded_at)}
                </p>
              </div>
              <button
                onClick={() => setPlayer(null)}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              key={player.video.id}
              src={player.url}
              controls
              autoPlay
              className="w-full max-h-[70vh] bg-black"
            />
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
              <button
                onClick={() => handleDownload(player.video)}
                disabled={downloadingId === player.video.id}
                className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {downloadingId === player.video.id ? "Preparing…" : "Download"}
              </button>
              <button
                onClick={() => setPlayer(null)}
                className="bg-violet-400 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}