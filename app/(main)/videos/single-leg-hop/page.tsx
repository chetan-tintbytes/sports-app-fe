"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { HorizontalJumpRun, VideoDetail } from "@/utils/types/index";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const round2 = (v: number) => Math.round(v * 100) / 100;

// ── Stat card ──────────────────────────────────────────────

// ── Shared video header ─────────────────────────────────────────────────────

function VideoHeader({ videoDetail, runnerName }: { videoDetail: VideoDetail; runnerName?: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <video
        src={videoDetail.view_url}
        controls
        preload="metadata"
        className="w-full max-h-52 bg-black object-contain"
      />
      <div className="px-4 py-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 border-t border-gray-50">
        <span>
          <span className="font-medium text-gray-700">Video: </span>
          {videoDetail.video.original_name}
        </span>
        {videoDetail.video.uploader_name && (
          <span>
            <span className="font-medium text-gray-700">Uploaded by: </span>
            {videoDetail.video.uploader_name}
          </span>
        )}
        {runnerName && (
          <span>
            <span className="font-medium text-gray-700">Analysis by: </span>
            {runnerName}
          </span>
        )}
      </div>
    </div>
  );
}


function StatCard({
  label,
  value,
  unit,
  color,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center gap-2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</div>
      <div className="text-3xl font-bold text-gray-800">{round2(value)}</div>
      <div className="text-xs text-gray-400">{unit}</div>
    </div>
  );
}

// ── Main content ───────────────────────────────────────────

function HorizontalJumpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getToken() ?? "";

  const runId = searchParams.get("runId");
  const videoId = searchParams.get("id");

  const [run, setRun] = useState<HorizontalJumpRun | null>(null);
  const [videoDetail, setVideoDetail] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!runId) {
      setError("No analysis run specified");
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [data, vid] = await Promise.all([
          api.getHorizontalJumpRun(token, Number(runId)),
          videoId ? api.getVideo(token, Number(videoId)).catch(() => null) : Promise.resolve(null),
        ]);
        setRun(data);
        setVideoDetail(vid);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [runId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center">
        <svg className="animate-spin text-sky-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="bg-white/80 rounded-3xl border border-gray-100 shadow-sm p-10 text-center max-w-sm w-full">
          <p className="text-gray-600 text-sm mb-4">{error || "Analysis not found"}</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Split distance into metres + remaining cm for display
  const distanceM = Math.floor(run.jump_distance_cm / 100);
  const distanceRemCm = round2(run.jump_distance_cm % 100);

  // Width of the jump bar relative to a 10 m frame (1000 cm)
  const jumpBarPct = Math.min(100, (run.jump_distance_cm / 1000) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back */}
        <button
          onClick={() => router.push(`/videos/details?id=${videoId}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-sky-600 transition-colors group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Video
        </button>


        {/* Source video + uploader / runner info */}
        {videoDetail && <VideoHeader videoDetail={videoDetail} runnerName={run?.runner_name} />}

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-2xl shadow-lg shadow-sky-200 mb-4">
            {/* Right-arrow icon representing a horizontal jump */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="13 6 19 12 13 18" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Single Leg Hop</h1>
          <p className="text-gray-500 text-sm">
            AI Analysis · {formatDate(run.created_at)}
          </p>
        </div>

        {/* Main stat cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Jump Distance"
            value={run.jump_distance_cm}
            unit="centimetres"
            color="bg-sky-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            }
          />
          <StatCard
            label="Flight Time"
            value={run.flight_time_s}
            unit="seconds"
            color="bg-indigo-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
        </div>

        {/* Detail card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Breakdown</h2>

          {[
            {
              label: "Jump distance",
              value: `${round2(run.jump_distance_cm)} cm`,
              sub: `${distanceM}m ${distanceRemCm}cm`,
            },
            {
              label: "Flight time",
              value: `${round2(run.flight_time_s)} s`,
              sub: `${round2(run.flight_time_s * 1000)} ms`,
            },
            {
              label: "Frame width reference",
              value: "10 m",
              sub: "Fixed calibration — camera framed to 1000 cm",
            },
            {
              label: "Distance as % of frame",
              value: `${round2(jumpBarPct)}%`,
              sub: "Jump distance relative to the 10 m field of view",
            },
          ].map(({ label, value, sub }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <p className="text-sm font-bold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Jump distance visualiser — horizontal track */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Jump vs 10 m Frame</h2>
          <p className="text-xs text-gray-400 mb-5">
            The full bar represents the 10 m camera field of view.
          </p>

          {/* Track */}
          <div className="relative h-10 bg-gray-100 rounded-full overflow-hidden">
            {/* Jump fill */}
            <div
              className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full transition-all duration-700"
              style={{ width: `${jumpBarPct}%` }}
            />
            {/* Distance label inside bar (or to the right if too narrow) */}
            <span
              className={`absolute inset-y-0 flex items-center text-xs font-bold transition-all ${
                jumpBarPct > 25
                  ? "right-2 text-white"
                  : "text-sky-600"
              }`}
              style={jumpBarPct <= 25 ? { left: `calc(${jumpBarPct}% + 8px)` } : {}}
            >
              {round2(run.jump_distance_cm)} cm
            </span>
          </div>

          {/* Scale labels */}
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>0 m</span>
            <span>2.5 m</span>
            <span>5 m</span>
            <span>7.5 m</span>
            <span>10 m</span>
          </div>
        </div>

        {/* Info note */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl px-5 py-3.5 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-sky-700 leading-relaxed">
            Distance is measured from the front foot at takeoff to the front foot at landing using pose estimation. The camera must be set up perpendicular to the jump direction and framed so the full width equals exactly 10 metres.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function HorizontalJumpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 flex items-center justify-center">
        <svg className="animate-spin text-sky-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    }>
      <HorizontalJumpContent />
    </Suspense>
  );
}