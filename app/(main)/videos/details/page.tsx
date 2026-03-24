"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { Video, AnalysisRun, AnalysisType, VerticalLeapRun } from "@/utils/types/index";

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
    hour: "2-digit",
    minute: "2-digit",
  });

const FORMAT_COLORS: Record<string, string> = {
  mp4: "bg-blue-500",
  mov: "bg-purple-500",
  avi: "bg-rose-500",
  mkv: "bg-indigo-500",
  webm: "bg-teal-500",
};

// ── Process Modal ──────────────────────────────────────────

function ProcessModal({
  onClose,
  onConfirmFlyRun,
  onConfirmVerticalLeap,
  processing,
}: {
  onClose: () => void;
  onConfirmFlyRun: () => void;
  onConfirmVerticalLeap: (heightCm: number) => void;
  processing: boolean;
}) {
  const [selected, setSelected] = useState<AnalysisType>("fly-run");
  const [heightInput, setHeightInput] = useState("");
  const [heightError, setHeightError] = useState("");

  const handleConfirm = () => {
    if (selected === "fly-run") {
      onConfirmFlyRun();
      return;
    }
    // vertical-leap — validate height
    const val = parseFloat(heightInput);
    if (!heightInput.trim() || isNaN(val) || val <= 0 || val > 300) {
      setHeightError("Please enter a valid height between 1 and 300 cm");
      return;
    }
    setHeightError("");
    onConfirmVerticalLeap(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-800 text-base">Process with AI</h3>
          <button
            onClick={onClose}
            disabled={processing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">Select the type of analysis to perform:</p>

        <div className="space-y-2 mb-4">
          {([
            { type: "fly-run" as AnalysisType, label: "Fly Run", description: "Analyse sprint speed over time" },
            { type: "vertical-leap" as AnalysisType, label: "Vertical Leap", description: "Measure jump height and flight time" },
          ]).map((opt) => (
            <button
              key={opt.type}
              onClick={() => { setSelected(opt.type); setHeightError(""); }}
              disabled={processing}
              className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                selected === opt.type
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              } disabled:opacity-50`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                selected === opt.type ? "border-blue-500" : "border-gray-300"
              }`}>
                {selected === opt.type && (
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                <p className="text-xs mt-0.5 text-gray-500">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Height input — only shown for vertical-leap */}
        {selected === "vertical-leap" && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Athlete height (cm)
            </label>
            <input
              type="number"
              placeholder="e.g. 175"
              value={heightInput}
              onChange={(e) => { setHeightInput(e.target.value); setHeightError(""); }}
              disabled={processing}
              min={1}
              max={300}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 disabled:opacity-50"
            />
            {heightError && (
              <p className="text-xs text-red-500 mt-1.5">{heightError}</p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
                  <path d="M12 3a9 9 0 019 9" />
                </svg>
                Analysing…
              </>
            ) : (
              "Run Analysis"
            )}
          </button>
        </div>

        {processing && (
          <p className="text-xs text-center text-gray-400 mt-3">
            This may take a moment while the video is analysed…
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Content ───────────────────────────────────────────

function VideoDetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getToken() ?? "";

  const [video, setVideo] = useState<Video | null>(null);
  const [viewUrl, setViewUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Analysis state — track both types independently
  const [latestFlyRun, setLatestFlyRun] = useState<AnalysisRun | null>(null);
  const [latestLeapRun, setLatestLeapRun] = useState<VerticalLeapRun | null>(null);

  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processError, setProcessError] = useState("");

  const videoId = searchParams.get("id");

  useEffect(() => {
    if (!videoId) {
      setError("No video ID provided");
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const data = await api.getVideo(token, Number(videoId));
        setVideo(data.video);
        setViewUrl(data.view_url);

        // Fetch latest of both types in parallel — ignore 404s
        const [flyResult, leapResult] = await Promise.allSettled([
          api.getLatestAnalysis(token, Number(videoId), "fly-run"),
          api.getLatestVerticalLeap(token, Number(videoId)),
        ]);
        if (flyResult.status === "fulfilled") setLatestFlyRun(flyResult.value);
        if (leapResult.status === "fulfilled") setLatestLeapRun(leapResult.value);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load video");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [videoId, token]);

  const handleConfirmFlyRun = async () => {
    if (!videoId) return;
    setProcessing(true);
    setProcessError("");
    try {
      const result = await api.processVideo(token, Number(videoId), { analysis_type: "fly-run" });
      setLatestFlyRun(result.run);
      setShowProcessModal(false);
      // Navigate straight to analysis page
      router.push(`/videos/analysis?id=${videoId}&runId=${result.run.id}`);
    } catch (err) {
      setProcessError(err instanceof ApiError ? err.message : "Analysis failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmVerticalLeap = async (heightCm: number) => {
    if (!videoId) return;
    setProcessing(true);
    setProcessError("");
    try {
      const result = await api.processVerticalLeap(token, Number(videoId), heightCm);
      setLatestLeapRun(result.run);
      setShowProcessModal(false);
      // Navigate straight to vertical leap results page
      router.push(`/videos/vertical-leap?id=${videoId}&runId=${result.run.id}`);
    } catch (err) {
      setProcessError(err instanceof ApiError ? err.message : "Analysis failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <svg className="animate-spin text-blue-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white/80 rounded-3xl border border-gray-100 shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm mb-4">{error || "Video not found"}</p>
          <button onClick={() => router.back()} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const fmtColor = FORMAT_COLORS[video.format?.toLowerCase()] ?? "bg-gray-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-6 group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to All Videos
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Video player */}
          <div className="relative w-full aspect-video bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
            {viewUrl ? (
              <video src={viewUrl} controls className="w-full h-full object-contain" preload="metadata" />
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
            )}
            <span className={`absolute top-3 left-3.5 ${fmtColor} text-white text-xs font-bold rounded-md px-2.5 py-1 uppercase tracking-wide`}>
              {video.format || "—"}
            </span>
          </div>

          <div className="p-6 space-y-5">
            <div>
              <h1 className="text-xl font-bold text-gray-800 mb-0.5">{video.original_name}</h1>
              <p className="text-xs text-gray-400 font-mono">{video.filename}</p>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Size", value: formatSize(video.size) },
                { label: "Format", value: video.format?.toUpperCase() || "—" },
                { label: "Uploaded", value: formatDate(video.uploaded_at) },
                { label: "Last updated", value: formatDate(video.updated_at) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-0.5 font-medium">{label}</p>
                  <p className="text-sm font-semibold text-gray-700">{value}</p>
                </div>
              ))}
            </div>

            {/* Storage path */}
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <p className="text-xs text-gray-400 mb-0.5 font-medium">Storage path</p>
              <p className="text-xs font-mono text-gray-500 break-all">{video.s3_key}</p>
            </div>

            {/* Process error */}
            {processError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {processError}
              </div>
            )}

            {/* ── Latest Fly Run summary ── */}
            {latestFlyRun && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Latest Fly Run
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(latestFlyRun.created_at)}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Max", value: `${latestFlyRun.max_speed_kmh} km/h` },
                    { label: "Avg", value: `${latestFlyRun.avg_speed_kmh} km/h` },
                    { label: "Min", value: `${latestFlyRun.min_speed_kmh} km/h` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-lg p-2.5 text-center border border-blue-100">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/videos/analysis?id=${videoId}&runId=${latestFlyRun.id}`)}
                  className="w-full py-2 rounded-lg bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  View Full Analysis
                </button>
              </div>
            )}

            {/* ── Latest Vertical Leap summary ── */}
            {latestLeapRun && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                      Latest Vertical Leap
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">{formatDate(latestLeapRun.created_at)}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: "Jump Height", value: `${latestLeapRun.jump_height_cm} cm` },
                    { label: "Flight Time", value: `${latestLeapRun.flight_time_s} s` },
                    { label: "Athlete Height", value: `${latestLeapRun.height_cm} cm` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white rounded-lg p-2.5 text-center border border-emerald-100">
                      <p className="text-xs text-gray-400">{label}</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => router.push(`/videos/vertical-leap?id=${videoId}&runId=${latestLeapRun.id}`)}
                  className="w-full py-2 rounded-lg bg-white border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="17 11 12 6 7 11" />
                    <polyline points="17 18 12 13 7 18" />
                  </svg>
                  View Full Results
                </button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              {viewUrl && (
                <a
                  href={viewUrl}
                  download={video.original_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all shadow-md shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download
                </a>
              )}
              <button
                onClick={() => setShowProcessModal(true)}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white text-sm font-semibold transition-all shadow-md shadow-purple-200 hover:shadow-purple-300 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                {latestFlyRun || latestLeapRun ? "Re-analyse with AI" : "Process with AI"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showProcessModal && (
        <ProcessModal
          onClose={() => { if (!processing) setShowProcessModal(false); }}
          onConfirmFlyRun={handleConfirmFlyRun}
          onConfirmVerticalLeap={handleConfirmVerticalLeap}
          processing={processing}
        />
      )}
    </div>
  );
}

export default function VideoDetailsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <svg className="animate-spin text-blue-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    }>
      <VideoDetailsContent />
    </Suspense>
  );
}