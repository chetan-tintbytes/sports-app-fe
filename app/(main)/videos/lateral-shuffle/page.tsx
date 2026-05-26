"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { LateralShuffleRun } from "@/utils/types/index";

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

// ── Symmetry gauge ─────────────────────────────────────────

function SymmetryGauge({ symmetryPct, leftCount, rightCount }: {
  symmetryPct: number;
  leftCount: number;
  rightCount: number;
}) {
  const getLabel = () => {
    if (symmetryPct >= 90) return { label: "Excellent", color: "text-emerald-500" };
    if (symmetryPct >= 75) return { label: "Good", color: "text-blue-500" };
    if (symmetryPct >= 60) return { label: "Moderate", color: "text-amber-500" };
    return { label: "Asymmetric", color: "text-red-500" };
  };
  const zone = getLabel();

  // Left vs right bar — left fills from centre leftward, right rightward
  const total = leftCount + rightCount;
  const leftPct = total > 0 ? (leftCount / total) * 100 : 50;
  const rightPct = 100 - leftPct;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Symmetry</h2>
        <span className={`text-sm font-semibold ${zone.color}`}>{zone.label}</span>
      </div>

      {/* Symmetry score */}
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold text-gray-800">{round2(symmetryPct)}</span>
        <span className="text-sm text-gray-400 mb-1">%</span>
      </div>

      {/* Symmetry fill bar */}
      <div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${symmetryPct}%`,
              background: "linear-gradient(to right, #F59E0B, #10B981)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Left vs Right split */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Left vs Right split</p>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-orange-500 w-8 text-right">{leftCount}L</span>
          <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-orange-400 rounded-l-full transition-all duration-700"
              style={{ width: `${leftPct}%` }}
            />
            <div
              className="h-full bg-amber-300 rounded-r-full transition-all duration-700"
              style={{ width: `${rightPct}%` }}
            />
          </div>
          <span className="text-xs font-bold text-amber-500 w-8">{rightCount}R</span>
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-400">
          <span className="text-orange-400 font-medium">Left</span>
          <span className="text-amber-400 font-medium">Right</span>
        </div>
      </div>
    </div>
  );
}

// ── Width comparison card ──────────────────────────────────

function WidthComparison({ run }: { run: LateralShuffleRun }) {
  const maxWidth = Math.max(run.left_avg_width_cm, run.right_avg_width_cm, 1);
  const leftPct = (run.left_avg_width_cm / maxWidth) * 100;
  const rightPct = (run.right_avg_width_cm / maxWidth) * 100;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
      <h2 className="text-sm font-semibold text-gray-700">Width Comparison</h2>
      <p className="text-xs text-gray-400 -mt-2">
        Average shuffle width per side. Bars scaled to the wider side.
      </p>

      {/* Left */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-600">Left side</span>
          <span className="text-xs font-bold text-orange-600">{round2(run.left_avg_width_cm)} cm</span>
        </div>
        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-700"
            style={{ width: `${leftPct}%` }}
          />
          {leftPct > 15 && (
            <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold text-white">
              {round2(run.left_avg_width_cm)} cm
            </span>
          )}
        </div>
      </div>

      {/* Right */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-xs font-medium text-gray-600">Right side</span>
          <span className="text-xs font-bold text-amber-600">{round2(run.right_avg_width_cm)} cm</span>
        </div>
        <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-700"
            style={{ width: `${rightPct}%` }}
          />
          {rightPct > 15 && (
            <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold text-white">
              {round2(run.right_avg_width_cm)} cm
            </span>
          )}
        </div>
      </div>

      {/* Avg */}
      <div className="pt-1 border-t border-gray-100">
        <div className="flex justify-between">
          <span className="text-xs text-gray-500">Overall avg width</span>
          <span className="text-xs font-bold text-gray-700">{round2(run.avg_shuffle_width_cm)} cm</span>
        </div>
      </div>
    </div>
  );
}

// ── Main content ───────────────────────────────────────────

function LateralShuffleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getToken() ?? "";

  const runId = searchParams.get("runId");
  const videoId = searchParams.get("id");

  const [run, setRun] = useState<LateralShuffleRun | null>(null);
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
        const data = await api.getLateralShuffleRun(token, Number(runId));
        setRun(data);
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <svg className="animate-spin text-orange-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-6">
        <div className="bg-white/80 rounded-3xl border border-gray-100 shadow-sm p-10 text-center max-w-sm w-full">
          <p className="text-gray-600 text-sm mb-4">{error || "Analysis not found"}</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Back */}
        <button
          onClick={() => router.push(`/videos/details?id=${videoId}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Video
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl shadow-lg shadow-orange-200 mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 8 21 12 17 16" />
              <polyline points="7 8 3 12 7 16" />
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Lateral Shuffle</h1>
          <p className="text-gray-500 text-sm">
            AI Analysis · {formatDate(run.created_at)}
          </p>
        </div>

        {/* Main stat cards — 2×2 grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Total shuffles"
            value={run.shuffle_count}
            unit="shuffles"
            color="bg-orange-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="17 8 21 12 17 16" />
                <polyline points="7 8 3 12 7 16" />
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
            }
          />
          <StatCard
            label="Symmetry"
            value={round2(run.symmetry_pct)}
            unit="percent"
            color="bg-amber-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round">
                <line x1="12" y1="3" x2="12" y2="21" />
                <path d="M3 9l9-6 9 6" />
                <path d="M3 15l9 6 9-6" />
              </svg>
            }
          />
          <StatCard
            label="Avg speed"
            value={round2(run.avg_shuffle_speed_cm_s)}
            unit="cm / s"
            color="bg-yellow-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2.2" strokeLinecap="round">
                <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            }
          />
          <StatCard
            label="Active duration"
            value={round2(run.active_duration_s)}
            unit="seconds"
            color="bg-orange-50"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
        </div>

        {/* Symmetry gauge */}
        <SymmetryGauge
          symmetryPct={run.symmetry_pct}
          leftCount={run.shuffles_per_side_left}
          rightCount={run.shuffles_per_side_right}
        />

        {/* Width comparison */}
        <WidthComparison run={run} />

        {/* Detail breakdown */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6 space-y-1">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Full Breakdown</h2>

          {[
            {
              label: "Total shuffles",
              value: `${run.shuffle_count}`,
              sub: "Total side-to-side shuffles detected in the video",
            },
            {
              label: "Shuffles — left side",
              value: `${run.shuffles_per_side_left}`,
              sub: "Shuffles moving to the left",
            },
            {
              label: "Shuffles — right side",
              value: `${run.shuffles_per_side_right}`,
              sub: "Shuffles moving to the right",
            },
            {
              label: "Avg shuffle width",
              value: `${round2(run.avg_shuffle_width_cm)} cm`,
              sub: "Mean lateral distance covered per shuffle",
            },
            {
              label: "Left avg width",
              value: `${round2(run.left_avg_width_cm)} cm`,
              sub: "Mean width of left-side shuffles",
            },
            {
              label: "Right avg width",
              value: `${round2(run.right_avg_width_cm)} cm`,
              sub: "Mean width of right-side shuffles",
            },
            {
              label: "Symmetry",
              value: `${round2(run.symmetry_pct)}%`,
              sub: "How evenly effort is distributed left vs right (100% = perfect)",
            },
            {
              label: "Avg speed",
              value: `${round2(run.avg_shuffle_speed_cm_s)} cm/s`,
              sub: "Average lateral speed across all shuffles",
            },
            {
              label: "Avg transition time",
              value: `${round2(run.avg_transition_time_s)} s`,
              sub: "Mean time taken to change direction between shuffles",
            },
            {
              label: "Cadence",
              value: `${round2(run.cadence_shuffles_min)} shuffles/min`,
              sub: "Shuffle rate averaged over the active period",
            },
            {
              label: "Active duration",
              value: `${round2(run.active_duration_s)} s`,
              sub: "Total time classified as active shuffling",
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

        {/* Info note */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-5 py-3.5 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EA580C" strokeWidth="2.2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-orange-700 leading-relaxed">
            Lateral shuffle analysis uses pose estimation to track side-to-side movement. Symmetry above 80% is generally considered good. Best results are achieved with a front-facing camera at hip height capturing the full width of the shuffle.
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LateralShufflePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
        <svg className="animate-spin text-orange-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    }>
      <LateralShuffleContent />
    </Suspense>
  );
}