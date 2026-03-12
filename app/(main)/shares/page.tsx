"use client";
import React, { useState, ChangeEvent } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface SharedVideo {
  id: string;
  video: string;
  url: string;
  pin: string;
  expiryDate: string;
  shareOption: string;
}

// ─── DUMMY DATA ──────────────────────────────────────────────────────────────
const DUMMY_SHARED_VIDEOS: SharedVideo[] = [
  {
    id: "SV001",
    video: "Sprint Analysis - Arjun Nair",
    url: "https://share.org/v/arjun-sprint-01",
    pin: "4821",
    expiryDate: "2026-03-15",
    shareOption: "Public",
  },
  {
    id: "SV002",
    video: "Swimming Technique - Ananya Patel",
    url: "https://share.org/v/ananya-swim-02",
    pin: "7364",
    expiryDate: "2026-04-01",
    shareOption: "Private",
  },
  {
    id: "SV003",
    video: "Gymnastics Floor Routine - Priya Mehta",
    url: "https://share.org/v/priya-gym-03",
    pin: "—",
    expiryDate: "2026-03-28",
    shareOption: "Public",
  },
  {
    id: "SV004",
    video: "Badminton Serve Analysis - Meera Joshi",
    url: "https://share.org/v/meera-badminton-04",
    pin: "9102",
    expiryDate: "2026-02-28",
    shareOption: "Team Only",
  },
  {
    id: "SV005",
    video: "Football Dribbling - Chetan Sharma",
    url: "https://share.org/v/chetan-football-05",
    pin: "—",
    expiryDate: "2026-05-10",
    shareOption: "Public",
  },
  {
    id: "SV006",
    video: "100m Race Review - Vikram Singh",
    url: "https://share.org/v/vikram-100m-06",
    pin: "5537",
    expiryDate: "2026-03-05",
    shareOption: "Private",
  },
  {
    id: "SV007",
    video: "Strength Training Session - Rohit Desai",
    url: "https://share.org/v/rohit-strength-07",
    pin: "—",
    expiryDate: "2026-04-20",
    shareOption: "Team Only",
  },
  {
    id: "SV008",
    video: "Relay Handoff Drill - Team Alpha",
    url: "https://share.org/v/team-alpha-relay-08",
    pin: "3319",
    expiryDate: "2026-06-01",
    shareOption: "Public",
  },
];

// ─── ICONS ───────────────────────────────────────────────────────────────────
const WrenchIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const ChevronDown = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

const SortIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <polyline points="6,9 12,3 18,9" />
    <polyline points="6,15 12,21 18,15" />
  </svg>
);

// ─── PAGE COMPONENT ──────────────────────────────────────────────────────────
export default function MySharedVideoResultPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = DUMMY_SHARED_VIDEOS.filter(
    (v) =>
      v.video.toLowerCase().includes(search.toLowerCase()) ||
      v.url.toLowerCase().includes(search.toLowerCase()) ||
      v.shareOption.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const start = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, filtered.length);

  const columns = [
    { label: "ID", sortable: true },
    { label: "VIDEO", sortable: true },
    { label: "URL", sortable: true },
    { label: "PIN", sortable: true },
    { label: "EXPIRY DATE", sortable: true },
    { label: "SHARE OPTION", sortable: true },
    { label: "ACTION", sortable: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">
          My Shared Video/Result
        </h1>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          {/* Top Controls */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            {/* Show entries */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-300"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries</span>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 flex-1 max-w-xl">
              <input
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search records"
                className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-400 text-white">
                  {columns.map((col) => (
                    <th
                      key={col.label}
                      className="px-4 py-3 text-left text-xs font-bold tracking-wider first:rounded-l-xl last:rounded-r-xl"
                    >
                      <div className="flex items-center gap-1.5">
                        {col.label}
                        {col.sortable && (
                          <span className="opacity-80">
                            <SortIcon />
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-gray-400 bg-gray-50/50"
                    >
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  paginated.map((v, i) => (
                    <tr
                      key={v.id}
                      className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {v.id}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors text-left">
                          {v.video}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-blue-400 hover:text-blue-600 text-xs truncate max-w-[160px]">
                        <a href={v.url} target="_blank" rel="noreferrer">
                          {v.url}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                        {v.pin}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {v.expiryDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                            v.shareOption === "Public"
                              ? "bg-green-100 text-green-700"
                              : v.shareOption === "Private"
                                ? "bg-red-100 text-red-600"
                                : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          {v.shareOption}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="flex items-center gap-1.5 bg-violet-400 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          <WrenchIcon /> ACTION <ChevronDown />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              Showing {start} to {end} of {filtered.length} entries
            </p>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              {[
                { label: "FIRST", action: () => setPage(1) },
                {
                  label: "PREVIOUS",
                  action: () => setPage((p) => Math.max(1, p - 1)),
                },
                {
                  label: "NEXT",
                  action: () => setPage((p) => Math.min(totalPages, p + 1)),
                },
                { label: "LAST", action: () => setPage(totalPages) },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className="px-3 py-1.5 rounded-lg hover:bg-gray-100 font-medium tracking-wide transition-colors"
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
