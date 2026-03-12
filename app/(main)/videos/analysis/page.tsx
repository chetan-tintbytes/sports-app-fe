"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { AnalysisRunWithPoints, AnalysisDataPoint } from "@/utils/types/index";

// ── Types ──────────────────────────────────────────────────

type Unit = "ms" | "kmh";

interface ZoomState {
  startIdx: number;
  endIdx: number;
}

// ── Helpers ────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const round2 = (v: number) => Math.round(v * 100) / 100;

const getSpeed = (p: AnalysisDataPoint, unit: Unit) =>
  unit === "ms" ? p.speed_ms : p.speed_kmh;

const unitLabel = (unit: Unit) => (unit === "ms" ? "m/s" : "km/h");

// ── Stat card ──────────────────────────────────────────────

function StatCard({ label, value, unit, color }: {
  label: string;
  value: number;
  unit: Unit;
  color: string;
}) {
  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4 text-center`}>
      <div className={`text-xs font-semibold uppercase tracking-widest mb-1 ${color}`}>{label}</div>
      <div className="text-2xl font-bold text-gray-800">{round2(value)}</div>
      <div className="text-xs text-gray-400 mt-0.5">{unitLabel(unit)}</div>
    </div>
  );
}

// ── Savitzky-Golay smoothing (JS port) ────────────────────
// Mirrors the Python script's savgol_filter with window=21, poly=3

function savgolCoeffs(windowLength: number, polyOrder: number): number[] {
  // For polynomial order 3, window 21, precompute convolution weights
  // General: least-squares polynomial fit in a sliding window
  const half = Math.floor(windowLength / 2);
  const coeffs: number[] = new Array(windowLength).fill(0);

  // Build Vandermonde matrix for positions -half..+half
  const pos = Array.from({ length: windowLength }, (_, i) => i - half);

  // For each position, compute weight using pseudo-inverse of Vandermonde
  // Simplified: use the standard SG coefficients via polynomial regression
  // We'll compute them numerically
  const A: number[][] = pos.map((p) =>
    Array.from({ length: polyOrder + 1 }, (_, k) => Math.pow(p, k))
  );

  // ATA = A^T * A
  const AT = A[0].map((_, colIdx) => A.map((row) => row[colIdx]));
  const ATA: number[][] = AT.map((row1) =>
    AT.map((row2) => row1.reduce((sum, v, i) => sum + v * row2[i], 0))
  );

  // Invert ATA (small matrix, use direct Gaussian elimination)
  const n = polyOrder + 1;
  const aug: number[][] = ATA.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
  ]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[pivot][col])) pivot = row;
    }
    [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
    const scale = aug[col][col];
    if (Math.abs(scale) < 1e-12) continue;
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= scale;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = 0; j < 2 * n; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  const ATAinv = aug.map((row) => row.slice(n));

  // ATAinv * A^T gives pseudo-inverse; we want row 0 (derivative order 0 = value)
  const pinvRow0 = ATAinv[0];
  for (let j = 0; j < windowLength; j++) {
    coeffs[j] = pinvRow0.reduce((sum, c, k) => sum + c * AT[k][j], 0);
  }
  return coeffs;
}

function savgolFilter(data: number[], windowLength: number, polyOrder: number): number[] {
  // Ensure window is odd and valid
  let wl = windowLength % 2 === 0 ? windowLength + 1 : windowLength;
  wl = Math.min(wl, data.length % 2 === 0 ? data.length - 1 : data.length);
  if (wl < polyOrder + 2) wl = polyOrder + 2 + (polyOrder % 2);

  const coeffs = savgolCoeffs(wl, polyOrder);
  const half = Math.floor(wl / 2);
  const result: number[] = new Array(data.length);

  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    for (let k = 0; k < wl; k++) {
      // Mirror padding at edges (like scipy's "mirror" mode)
      let idx = i - half + k;
      if (idx < 0) idx = -idx;
      if (idx >= data.length) idx = 2 * data.length - idx - 2;
      idx = Math.max(0, Math.min(data.length - 1, idx));
      sum += coeffs[k] * data[idx];
    }
    result[i] = Math.max(0, sum); // no negative speeds
  }
  return result;
}

// Convert array of {x,y} points to a smooth cubic bezier SVG path
function smoothBezierPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;

  // Catmull-Rom → cubic bezier conversion
  const tension = 0.4;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// ── Chart ──────────────────────────────────────────────────

interface ChartProps {
  points: AnalysisDataPoint[];
  unit: Unit;
  zoom: ZoomState;
  onZoom: (z: ZoomState) => void;
  showRaw: boolean;
  smoothing: boolean;
}

function SpeedChart({ points, unit, zoom, onZoom, showRaw, smoothing }: ChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; point: AnalysisDataPoint; smoothedSpeed: number;
  } | null>(null);
  const [dragStart, setDragStart]   = useState<number | null>(null);
  const [dragCurrent, setDragCurrent] = useState<number | null>(null);
  const [isPanning, setIsPanning]   = useState(false);
  const [panStart, setPanStart]     = useState<{ x: number; startIdx: number; endIdx: number } | null>(null);

  const PAD = { top: 24, right: 24, bottom: 48, left: 64 };
  const W = 900;
  const H = 360;
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const visiblePoints = points.slice(zoom.startIdx, zoom.endIdx + 1);
  const rawSpeeds     = visiblePoints.map((p) => getSpeed(p, unit));

  // Apply SG smoothing (window=21, poly=3, same as Python script)
  const smoothedSpeeds = smoothing && visiblePoints.length >= 5
    ? savgolFilter(rawSpeeds, 21, 3)
    : rawSpeeds;

  const displaySpeeds = smoothedSpeeds;
  const allSpeeds     = [...rawSpeeds, ...smoothedSpeeds];

  const minSpeed   = Math.max(0, Math.min(...allSpeeds));
  const maxSpeed   = Math.max(...allSpeeds);
  const speedRange = maxSpeed - minSpeed || 1;
  // Y axis starts at 0 like the Python plot
  const yMin    = 0;
  const yMax    = maxSpeed + speedRange * 0.12;
  const yRange  = yMax - yMin;

  const toX = (i: number) =>
    visiblePoints.length <= 1 ? 0 : (i / (visiblePoints.length - 1)) * chartW;
  const toY = (speed: number) => chartH - ((speed - yMin) / yRange) * chartH;

  // Build point arrays
  const rawPts      = visiblePoints.map((p, i) => ({ x: toX(i), y: toY(getSpeed(p, unit)) }));
  const smoothedPts = visiblePoints.map((_, i) => ({ x: toX(i), y: toY(smoothedSpeeds[i]) }));

  const smoothLinePath = smoothBezierPath(smoothedPts);
  const rawLinePath    = smoothBezierPath(rawPts);

  const areaPath =
    smoothLinePath +
    ` L ${toX(visiblePoints.length - 1)} ${chartH} L ${toX(0)} ${chartH} Z`;

  // Y-axis ticks (6 gridlines, y starts at 0)
  const yTickCount  = 6;
  const yTickValues = Array.from({ length: yTickCount + 1 }, (_, i) =>
    yMin + (yRange * i) / yTickCount
  );

  // X-axis ticks
  const xTickCount   = Math.min(9, visiblePoints.length);
  const xTickIndices = Array.from({ length: xTickCount }, (_, i) =>
    Math.round((i / Math.max(1, xTickCount - 1)) * (visiblePoints.length - 1))
  );

  // Mouse → local index
  const clientXToLocalIdx = useCallback((clientX: number): number => {
    if (!svgRef.current) return 0;
    const rect  = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const svgX   = (clientX - rect.left) * scaleX - PAD.left;
    const frac   = Math.max(0, Math.min(1, svgX / chartW));
    return Math.round(frac * (visiblePoints.length - 1));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visiblePoints.length, chartW]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect   = svgRef.current.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const localIdx = clientXToLocalIdx(e.clientX);
    const pt       = visiblePoints[localIdx];
    const sp       = smoothedSpeeds[localIdx] ?? 0;

    if (pt) {
      setTooltip({
        x: (PAD.left + toX(localIdx)) / scaleX + rect.left,
        y: (PAD.top  + toY(sp))       / scaleY + rect.top,
        point: pt,
        smoothedSpeed: sp,
      });
    }

    if (dragStart !== null) setDragCurrent(localIdx);

    if (isPanning && panStart) {
      const delta = panStart.x - clientXToLocalIdx(e.clientX);
      const range = panStart.endIdx - panStart.startIdx;
      let newStart = panStart.startIdx + delta;
      let newEnd   = panStart.endIdx   + delta;
      if (newStart < 0)                { newStart = 0; newEnd = range; }
      if (newEnd >= points.length)     { newEnd = points.length - 1; newStart = newEnd - range; }
      onZoom({ startIdx: newStart, endIdx: newEnd });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: clientXToLocalIdx(e.clientX), startIdx: zoom.startIdx, endIdx: zoom.endIdx });
    } else {
      setDragStart(clientXToLocalIdx(e.clientX));
      setDragCurrent(null);
    }
  };

  const handleMouseUp = () => {
    if (dragStart !== null && dragCurrent !== null && Math.abs(dragCurrent - dragStart) > 2) {
      const a = Math.min(dragStart, dragCurrent);
      const b = Math.max(dragStart, dragCurrent);
      onZoom({ startIdx: zoom.startIdx + a, endIdx: zoom.startIdx + b });
    }
    setDragStart(null);
    setDragCurrent(null);
    setIsPanning(false);
    setPanStart(null);
  };

  const handleMouseLeave = () => { setTooltip(null); handleMouseUp(); };

  const dragBox =
    dragStart !== null && dragCurrent !== null
      ? {
          x:     PAD.left + Math.min(toX(dragStart), toX(dragCurrent)),
          width: Math.abs(toX(dragCurrent) - toX(dragStart)),
        }
      : null;

  // Tooltip hover line
  const hoverLineX =
    tooltip && svgRef.current
      ? PAD.left + toX(visiblePoints.findIndex((p) => p === tooltip.point))
      : null;

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full cursor-crosshair select-none"
        style={{ fontFamily: "system-ui, sans-serif" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          {/* Main area gradient – deep purple → transparent */}
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0.35" />
            <stop offset="60%"  stopColor="#8B5CF6" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.01" />
          </linearGradient>
          {/* Smoothed line gradient (left→right colour shift like matplotlib tab10) */}
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#6D28D9" />
            <stop offset="50%"  stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <clipPath id="chartClip">
            <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH} />
          </clipPath>
          {/* Subtle chart background */}
          <pattern id="minorGrid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#F3F4F6" strokeWidth="0.5"/>
          </pattern>
        </defs>

        {/* Chart background */}
        <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH}
          fill="#FAFAFA" rx="4" />

        {/* Minor grid pattern */}
        <rect x={PAD.left} y={PAD.top} width={chartW} height={chartH}
          fill="url(#minorGrid)" clipPath="url(#chartClip)" />

        {/* Major horizontal grid lines + Y labels */}
        {yTickValues.map((v, i) => {
          const y = PAD.top + toY(v);
          const isZero = v <= 0.001;
          return (
            <g key={i}>
              <line
                x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                stroke={isZero ? "#9CA3AF" : "#E5E7EB"}
                strokeWidth={isZero ? 1.5 : 1}
                strokeDasharray={isZero ? "none" : "4 3"}
              />
              <text x={PAD.left - 10} y={y + 4} textAnchor="end"
                fontSize="12" fill="#6B7280" fontWeight={isZero ? "600" : "400"}>
                {round2(v)}
              </text>
            </g>
          );
        })}

        {/* Vertical grid lines at X tick positions */}
        {xTickIndices.map((idx, i) => (
          <line key={i}
            x1={PAD.left + toX(idx)} y1={PAD.top}
            x2={PAD.left + toX(idx)} y2={PAD.top + chartH}
            stroke="#F3F4F6" strokeWidth="1" strokeDasharray="4 3"
          />
        ))}

        {/* Hover vertical line */}
        {hoverLineX !== null && (
          <line
            x1={hoverLineX} y1={PAD.top}
            x2={hoverLineX} y2={PAD.top + chartH}
            stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
          />
        )}

        {/* Raw data (faint, only when smoothing is on) */}
        {showRaw && smoothing && (
          <path
            d={rawLinePath}
            fill="none"
            stroke="#A78BFA"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.25"
            clipPath="url(#chartClip)"
            transform={`translate(${PAD.left}, ${PAD.top})`}
          />
        )}

        {/* Area fill */}
        <path
          d={areaPath}
          fill="url(#areaGrad)"
          clipPath="url(#chartClip)"
          transform={`translate(${PAD.left}, ${PAD.top})`}
        />

        {/* Main smooth line */}
        <path
          d={smoothLinePath}
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          clipPath="url(#chartClip)"
          transform={`translate(${PAD.left}, ${PAD.top})`}
        />

        {/* Drag selection box */}
        {dragBox && (
          <rect
            x={dragBox.x} y={PAD.top}
            width={dragBox.width} height={chartH}
            fill="#8B5CF6" fillOpacity="0.08"
            stroke="#8B5CF6" strokeWidth="1.5" strokeDasharray="5 3"
          />
        )}

        {/* Hover dot on smoothed line */}
        {tooltip && (() => {
          const localIdx = visiblePoints.findIndex((p) => p === tooltip.point);
          if (localIdx < 0) return null;
          const cx = PAD.left + toX(localIdx);
          const cy = PAD.top  + toY(tooltip.smoothedSpeed);
          return (
            <g>
              <circle cx={cx} cy={cy} r="7" fill="#7C3AED" opacity="0.15" />
              <circle cx={cx} cy={cy} r="4.5" fill="#7C3AED" stroke="white" strokeWidth="2" />
            </g>
          );
        })()}

        {/* X axis baseline */}
        <line
          x1={PAD.left} y1={PAD.top + chartH}
          x2={PAD.left + chartW} y2={PAD.top + chartH}
          stroke="#D1D5DB" strokeWidth="1.5"
        />
        {/* Y axis baseline */}
        <line
          x1={PAD.left} y1={PAD.top}
          x2={PAD.left} y2={PAD.top + chartH}
          stroke="#D1D5DB" strokeWidth="1.5"
        />

        {/* X axis tick labels */}
        {xTickIndices.map((idx, i) => {
          const x = PAD.left + toX(idx);
          const t = visiblePoints[idx]?.time_sec ?? 0;
          return (
            <g key={i}>
              <line x1={x} y1={PAD.top + chartH} x2={x} y2={PAD.top + chartH + 5}
                stroke="#9CA3AF" strokeWidth="1" />
              <text x={x} y={PAD.top + chartH + 18} textAnchor="middle"
                fontSize="12" fill="#6B7280">
                {round2(t)}s
              </text>
            </g>
          );
        })}

        {/* Axis labels */}
        <text
          x={PAD.left + chartW / 2} y={H - 4}
          textAnchor="middle" fontSize="13" fill="#4B5563" fontWeight="600">
          Time (seconds)
        </text>
        <text
          x={16} y={PAD.top + chartH / 2}
          textAnchor="middle" fontSize="13" fill="#4B5563" fontWeight="600"
          transform={`rotate(-90, 16, ${PAD.top + chartH / 2})`}
        >
          Speed ({unitLabel(unit)})
        </text>

        {/* Chart title */}
        <text
          x={PAD.left + chartW / 2} y={PAD.top - 6}
          textAnchor="middle" fontSize="13" fill="#6B7280" fontWeight="500">
          Runner Speed Analysis Over Time
          {smoothing ? " · Savitzky-Golay Smoothed (window=21, order=3)" : " · Raw Data"}
        </text>
      </svg>

      {/* Floating tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 56 }}
        >
          <div className="bg-gray-900/95 text-white text-xs rounded-xl px-3.5 py-2.5 shadow-2xl border border-white/10 backdrop-blur-sm">
            <p className="font-bold text-sm text-violet-300 mb-1">
              {round2(tooltip.smoothedSpeed)} {unitLabel(unit)}
            </p>
            <p className="text-gray-400">t = {round2(tooltip.point.time_sec)}s</p>
            {smoothing && (
              <p className="text-gray-500 text-[10px] mt-0.5">
                raw: {round2(getSpeed(tooltip.point, unit))} {unitLabel(unit)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────

function AnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = getToken() ?? "";

  const runId = searchParams.get("runId");
  const videoId = searchParams.get("id");

  const [run, setRun] = useState<AnalysisRunWithPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState<Unit>("kmh");
  const [zoom, setZoom] = useState<ZoomState>({ startIdx: 0, endIdx: 0 });

  useEffect(() => {
    if (!runId) {
      setError("No analysis run specified");
      setLoading(false);
      return;
    }
    const fetch = async () => {
      try {
        const data = await api.getAnalysisRun(token, Number(runId));
        setRun(data);
        setZoom({ startIdx: 0, endIdx: (data.data_points?.length ?? 1) - 1 });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load analysis");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [runId, token]);

  const handleResetZoom = () => {
    if (run?.data_points) {
      setZoom({ startIdx: 0, endIdx: run.data_points.length - 1 });
    }
  };

  const isZoomed = run?.data_points && (zoom.startIdx > 0 || zoom.endIdx < run.data_points.length - 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <svg className="animate-spin text-purple-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white/80 rounded-3xl border border-gray-100 shadow-sm p-10 text-center max-w-sm w-full">
          <p className="text-gray-600 text-sm mb-4">{error || "Analysis not found"}</p>
          <button onClick={() => router.back()} className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const points = run.data_points ?? [];
  const maxStat = unit === "ms" ? run.max_speed_ms : run.max_speed_kmh;
  const minStat = unit === "ms" ? run.min_speed_ms : run.min_speed_kmh;
  const avgStat = unit === "ms" ? run.avg_speed_ms : run.avg_speed_kmh;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Back */}
        <button
          onClick={() => router.push(`/videos/details?id=${videoId}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors group"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="group-hover:-translate-x-0.5 transition-transform">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Video
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-200 mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">AI Analysis</h1>
          <p className="text-gray-500 text-sm">
            {run.analysis_type === "fly-run" ? "Fly Run" : "Vertical Leap"} · {formatDate(run.created_at)} · {points.length} data points
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Max Speed" value={maxStat} unit={unit} color="text-emerald-500" />
          <StatCard label="Avg Speed" value={avgStat} unit={unit} color="text-blue-500" />
          <StatCard label="Min Speed" value={minStat} unit={unit} color="text-violet-500" />
        </div>

        {/* Chart card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Speed over Time</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {isZoomed
                  ? `Showing t=${round2(points[zoom.startIdx]?.time_sec ?? 0)}s — t=${round2(points[zoom.endIdx]?.time_sec ?? 0)}s · drag to zoom, shift+drag to pan`
                  : "Drag to zoom in on a region · shift+drag to pan"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Zoom reset */}
              {isZoomed && (
                <button
                  onClick={handleResetZoom}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Reset zoom
                </button>
              )}

              {/* Unit toggle */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                {(["kmh", "ms"] as Unit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      unit === u
                        ? "bg-white text-violet-600 shadow-sm"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {u === "kmh" ? "km/h" : "m/s"}
                  </button>
                ))}
              </div>

            </div>
            </div>
          </div>

          {points.length > 0 ? (
            <SpeedChart
              points={points}
              unit={unit}
              zoom={zoom}
              onZoom={setZoom}
              smoothing={true}
              showRaw={false}
            />
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No data points available
            </div>
          )}
        </div>

        {/* Zoom hint card */}
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-3.5 flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <p className="text-xs text-violet-700 leading-relaxed">
            <span className="font-semibold">Zoom:</span> Click and drag on the chart to zoom into a specific time range.{" "}
            <span className="font-semibold">Pan:</span> Hold <kbd className="bg-violet-100 px-1 py-0.5 rounded text-[10px] font-mono">Shift</kbd> and drag to pan across the data.{" "}
            Use <span className="font-semibold">Reset zoom</span> to return to the full view.
          </p>
        </div>
      </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <svg className="animate-spin text-purple-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
          <path d="M12 3a9 9 0 019 9" />
        </svg>
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  );
}