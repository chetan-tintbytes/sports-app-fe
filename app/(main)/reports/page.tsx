"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/utils/lib/api";
import { getToken } from "@/utils/lib/auth";
import { ReportRow, AnalysisType } from "@/utils/types/index";

// ── Helpers ────────────────────────────────────────────────

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const round2 = (v: number) => Math.round(v * 100) / 100;

const ANALYSIS_LABEL: Record<string, string> = {
  "fly-run": "Fly Run",
  "vertical-leap": "Vertical Leap",
};

const ANALYSIS_TAG_COLOR: Record<string, string> = {
  "fly-run": "bg-blue-100 text-blue-700",
  "vertical-leap": "bg-emerald-100 text-emerald-700",
};

// ── Icons ──────────────────────────────────────────────────

const SearchIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const FilterIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const RefreshIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const ChartIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const LeapIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="17 11 12 6 7 11" />
    <polyline points="17 18 12 13 7 18" />
  </svg>
);

// ── Column definitions ─────────────────────────────────────

const COLUMNS = [
  "REPORT NAME",
  "VIDEO",
  "ANALYSIS TYPE",
  "RESULT",
  "DATE",
  "ACTION",
];

// ── Result cell — renders differently per report type ──────

function ResultCell({ report }: { report: ReportRow }) {
  if (report.report_type === "vertical-leap") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-emerald-600">
          {round2(report.jump_height_cm ?? 0)} cm
          <span className="text-xs font-normal text-gray-400 ml-1">jump</span>
        </span>
        <span className="text-xs text-gray-400">
          {round2(report.flight_time_s ?? 0)} s flight
        </span>
      </div>
    );
  }
  // fly-run — no speed data in merged row, just show type indicator
  return (
    <span className="text-sm text-gray-400 italic">Speed analysis</span>
  );
}

// ── Component ──────────────────────────────────────────────

export default function Reports() {
  const router = useRouter();
  const token = getToken() ?? "";

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(50);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await api.getReports(token);
      setReports(data.reports ?? []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ── Filter & paginate ────────────────────────────────────

  const q = search.toLowerCase();
  const filtered = reports.filter(
    (r) =>
      r.original_name.toLowerCase().includes(q) ||
      ANALYSIS_LABEL[r.report_type].toLowerCase().includes(q)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex items-start justify-center min-h-full p-6 bg-[#F0F2F8]">
      <div className="w-full max-w-7xl">
        <h1 className="text-center text-2xl font-light text-gray-700 mb-6 tracking-wide">
          Reports
        </h1>

        <div className="bg-white rounded-2xl shadow-md p-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <button
              onClick={() => fetchReports(true)}
              disabled={refreshing}
              className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] disabled:bg-[#A78BFA] text-white text-xs font-bold tracking-widest uppercase px-5 py-3 rounded-full transition-colors"
            >
              <span className={refreshing ? "animate-spin" : ""}><RefreshIcon /></span>
              {refreshing ? "Refreshing…" : "Refresh Report List"}
            </button>

            {/* Filter chips */}
            <div className="flex items-center gap-2">
              {(["all", "fly-run", "vertical-leap"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => { setSearch(f === "all" ? "" : f === "fly-run" ? "Fly Run" : "Vertical Leap"); setCurrentPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    (f === "all" && search === "") || search === f
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                  }`}
                >
                  {f === "all" ? "All" : ANALYSIS_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="flex justify-center mb-6">
            <div className="relative w-full max-w-md">
              <span className="absolute left-4 top-1/2 -translate-y-1/2"><FilterIcon /></span>
              <input
                type="text"
                placeholder="Search by video name or analysis type…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-10 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm text-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-200"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2"><SearchIcon /></span>
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#8B5CF6] text-white">
                  {COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3.5 text-left text-xs font-bold tracking-widest uppercase first:rounded-tl-xl last:rounded-tr-xl whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="text-center py-14">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25" />
                          <path d="M12 3a9 9 0 019 9" />
                        </svg>
                        Loading reports…
                      </div>
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={COLUMNS.length} className="text-center py-14">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        <p className="text-sm">
                          {search ? "No reports match your search" : "No analysis reports yet"}
                        </p>
                        {!search && (
                          <p className="text-xs text-gray-400">
                            Process a video with AI to see results here
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((report, i) => (
                    <tr
                      key={`${report.report_type}-${report.run_id}`}
                      className={`border-b border-gray-100 transition-colors hover:bg-purple-50/40 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      {/* Report name */}
                      <td className="px-4 py-4 font-medium text-[#7C3AED] whitespace-nowrap">
                        {report.original_name}
                        <span className="ml-1.5 text-xs text-gray-400 font-normal">
                          #{report.run_id}
                        </span>
                      </td>

                      {/* Video name */}
                      <td className="px-4 py-4 text-gray-600 max-w-[180px] truncate">
                        <span title={report.original_name}>{report.original_name}</span>
                      </td>

                      {/* Analysis type tag */}
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ANALYSIS_TAG_COLOR[report.report_type]}`}>
                          {ANALYSIS_LABEL[report.report_type]}
                        </span>
                      </td>

                      {/* Result — varies by type */}
                      <td className="px-4 py-4">
                        <ResultCell report={report} />
                      </td>

                      {/* Date */}
                      <td className="px-4 py-4 text-gray-500 tabular-nums whitespace-nowrap">
                        {formatDate(report.created_at)}
                      </td>

                      {/* Action — routes to correct page per type */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() => {
                            if (report.report_type === "vertical-leap") {
                              router.push(`/videos/vertical-leap?id=${report.video_id}&runId=${report.run_id}`);
                            } else {
                              router.push(`/videos/analysis?id=${report.video_id}&runId=${report.run_id}`);
                            }
                          }}
                          className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full border-2 border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6] hover:text-white transition-all whitespace-nowrap"
                        >
                          {report.report_type === "vertical-leap" ? <LeapIcon /> : <ChartIcon />}
                          View Results
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 pt-3 flex-wrap gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Rows per page:</span>
              <select
                value={perPage}
                onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-300"
              >
                <option value={50}>50</option>
                <option value={25}>25</option>
                <option value={10}>10</option>
              </select>
              <span className="text-gray-400">
                {filtered.length} report{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-30 transition-colors"
              >«</button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-30 transition-colors"
              >‹</button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const mid = Math.min(Math.max(currentPage, 3), totalPages - 2);
                const page = totalPages <= 5 ? i + 1 : mid - 2 + i;
                if (page < 1 || page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                      currentPage === page
                        ? "bg-[#8B5CF6] text-white"
                        : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-30 transition-colors"
              >›</button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm text-gray-400 hover:text-purple-600 hover:bg-purple-50 disabled:opacity-30 transition-colors"
              >»</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}