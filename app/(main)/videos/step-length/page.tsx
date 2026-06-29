"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { StepLengthRun, VideoDetail} from "@/utils/types/index";

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
  value: number | string;
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
      <div className="text-3xl font-bold text-gray-800">{value}</div>
      <div className="text-xs text-gray-400">{unit}</div>
    </div>
  );
}

// ── Cadence gauge ──────────────────────────────────────────

function CadenceGauge({ cadence }: { cadence: number }) {
  // Typical walking cadence: 80–130 steps/min; running: 150–200
  const min = 0;
  const max = 200;
  const pct = Math.min(100, Math.max(0, ((cadence - min) / (max - min)) * 100));

  const getZone = () => {
    if (cadence < 80) return { label: "Slow", color: "text-amber-500" };
    if (cadence < 100) return { label: "Walking", color: "text-emerald-500" };
    if (cadence < 140) return { label: "Brisk", color: "text-blue-500" };
    return { label: "Running", color: "text-violet-500" };
  };
  const zone = getZone();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Cadence</h2>
      <div className="flex items-end justify-between mb-3">
        <div>
          <span className="text-4xl font-bold text-gray-800">{round2(cadence)}</span>
          <span className="text-sm text-gray-400 ml-1.5">steps / min</span>
        </div>
        <span className={`text-sm font-semibold ${zone.color}`}>{zone.label}</span>
      </div>

      {/* Gauge bar */}
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(to right, #10B981, #3B82F6, #8B5CF6)",
          }}
        />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-gray-400">
        <span>0</span>
        <span>80</span>
        <span>130</span>
        <span>200</span>
      </div>
    </div>
  );
}

// ── Main content ───────────────────────────────────────────

function StepLengthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getToken() ?? "";

  const runId = searchParams.get("runId");
  const videoId = searchParams.get("id");

  const [run, setRun] = useState<StepLengthRun | null>(null);
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
          api.getStepLengthRun(token, Number(runId)),
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
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
        <svg className="animate-spin text-teal-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white/80 rounded-3xl border border-gray-100 shadow-sm p-10 text-center max-w-sm w-full">
          <p className="text-gray-600 text-sm mb-4">{error || "Analysis not found"}</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const hasStride = run.avg_stride_length_cm > 0;
  const hasCadence = run.avg_cadence_steps_min > 0;

  // Step length as % of typical max (e.g. 120 cm = athlete stride reference)
  const stepBarPct = Math.min(100, (run.avg_step_length_cm / 120) * 100);
  const strideBarPct = hasStride
    ? Math.min(100, (run.avg_stride_length_cm / 240) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back */}
        <button
          onClick={() => router.push(`/videos/details?id=${videoId}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 transition-colors group"
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
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl shadow-lg shadow-teal-200 mb-4">
            {/* Footstep / walking icon */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h4l3 8 4-16 3 8h4" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Step Length</h1>
          <p className="text-gray-500 text-sm">
            AI Analysis · {formatDate(run.created_at)}
          </p>
        </div>

        {/* Main stat cards — 2×2 grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Steps detected"
            value={run.step_count}
            unit="steps"
            color="bg-teal-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="5" r="2" />
                <path d="M10 22v-6.57" />
                <path d="M10 11.5a4 4 0 0 0 4 4" />
                <path d="M14 22v-4" />
                <path d="M14 11.5a4 4 0 0 1-4 4" />
                <path d="M10 8a3.5 3.5 0 0 1 4 0" />
              </svg>
            }
          />
          <StatCard
            label="Avg step length"
            value={round2(run.avg_step_length_cm)}
            unit="centimetres"
            color="bg-emerald-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="13 6 19 12 13 18" />
              </svg>
            }
          />
          <StatCard
            label="Avg stride length"
            value={hasStride ? round2(run.avg_stride_length_cm) : "—"}
            unit={hasStride ? "centimetres" : "not enough steps"}
            color="bg-cyan-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <polyline points="8 8 3 12 8 16" />
                <polyline points="16 8 21 12 16 16" />
              </svg>
            }
          />
          <StatCard
            label="Cadence"
            value={hasCadence ? round2(run.avg_cadence_steps_min) : "—"}
            unit={hasCadence ? "steps / min" : "not enough steps"}
            color="bg-violet-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
        </div>

        {/* Detail breakdown card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 space-y-1">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Breakdown</h2>

          {[
            {
              label: "Steps detected",
              value: `${run.step_count} steps`,
              sub: "Total foot contacts identified in the video",
            },
            {
              label: "Avg step length",
              value: `${round2(run.avg_step_length_cm)} cm`,
              sub: "Heel-to-heel distance, one foot to the other",
            },
            {
              label: "Avg stride length",
              value: hasStride ? `${round2(run.avg_stride_length_cm)} cm` : "—",
              sub: hasStride
                ? "Full cycle — same foot heel-to-heel (2 × step length)"
                : "Requires at least 4 detected steps",
            },
            {
              label: "Cadence",
              value: hasCadence ? `${round2(run.avg_cadence_steps_min)} steps/min` : "—",
              sub: hasCadence
                ? "Steps per minute averaged over the clip"
                : "Requires timing data from multiple steps",
            },
          ].map(({ label, value, sub }) => (
            <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <p className="text-sm font-bold text-gray-800 ml-4 text-right">{value}</p>
            </div>
          ))}
        </div>

        {/* Step length visualiser */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-700">Length visualiser</h2>
          <p className="text-xs text-gray-400 -mt-3">
            Bars are scaled relative to 120 cm (step) and 240 cm (stride) reference maximums.
          </p>

          {/* Step length bar */}
          <div>
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">Step length</span>
              <span className="text-xs font-bold text-teal-600">{round2(run.avg_step_length_cm)} cm</span>
            </div>
            <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-700"
                style={{ width: `${stepBarPct}%` }}
              />
              {stepBarPct > 15 && (
                <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold text-white">
                  {round2(run.avg_step_length_cm)} cm
                </span>
              )}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>0 cm</span>
              <span>60 cm</span>
              <span>120 cm</span>
            </div>
          </div>

          {/* Stride length bar */}
          {hasStride && (
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-600">Stride length</span>
                <span className="text-xs font-bold text-cyan-600">{round2(run.avg_stride_length_cm)} cm</span>
              </div>
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-700"
                  style={{ width: `${strideBarPct}%` }}
                />
                {strideBarPct > 15 && (
                  <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold text-white">
                    {round2(run.avg_stride_length_cm)} cm
                  </span>
                )}
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>0 cm</span>
                <span>120 cm</span>
                <span>240 cm</span>
              </div>
            </div>
          )}
        </div>

        {/* Cadence gauge — only when available */}
        {hasCadence && <CadenceGauge cadence={run.avg_cadence_steps_min} />}

        {/* Info note */}
        <div className="bg-teal-50 border border-teal-100 rounded-2xl px-5 py-3.5 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2.2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-teal-700 leading-relaxed">
            Step length is measured foot-to-foot using pose estimation. Stride length and cadence require at least 4 detected steps and are omitted when insufficient steps are found. Best results with a side-on camera angle at hip height.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function StepLengthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex items-center justify-center">
        <svg className="animate-spin text-teal-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    }>
      <StepLengthContent />
    </Suspense>
  );
}