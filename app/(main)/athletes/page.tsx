"use client";
import React, { useState, ChangeEvent } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Athlete {
  id: string;
  name: string;
  videos: number;
  joined: string;
}

// ─── DUMMY DATA ──────────────────────────────────────────────────────────────
const DUMMY_ATHLETES: Athlete[] = [
  { id: "ATH001", name: "Ananya Patel", videos: 12, joined: "2025-12-01" },
  { id: "ATH002", name: "Priya Mehta", videos: 8, joined: "2026-01-05" },
  { id: "ATH003", name: "Rohit Desai", videos: 21, joined: "2025-11-18" },
  { id: "ATH004", name: "Sneha Kapoor", videos: 5, joined: "2026-01-22" },
  { id: "ATH005", name: "Arjun Nair", videos: 17, joined: "2025-12-14" },
  { id: "ATH006", name: "Kavya Reddy", videos: 3, joined: "2026-02-01" },
  { id: "ATH007", name: "Vikram Singh", videos: 29, joined: "2025-11-30" },
  { id: "ATH008", name: "Divya Iyer", videos: 11, joined: "2025-12-20" },
];

// ─── ICONS ───────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const RefreshIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <polyline points="23,4 23,10 17,10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

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

// ─── PAGE COMPONENT ──────────────────────────────────────────────────────────
export default function MyAthletesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(50);

  const filtered = DUMMY_ATHLETES.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">
          My Athletes
        </h1>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <button className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow">
              <PlusIcon /> ADD NEW ATHLETES
            </button>
            <button className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow">
              <RefreshIcon /> REFRESH TO UPDATE MEMBER LIST
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3 border border-gray-200 rounded-full px-4 py-2.5 mb-5 bg-gray-50 max-w-lg mx-auto">
            <span className="text-gray-400 flex-shrink-0">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Athlete Name"
              className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
            />
            <SearchIcon />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-400 text-white">
                  {["CREATION DATE", "ATHLETE NAME", "# VIDEOS", "ACTION"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-bold tracking-wider first:rounded-l-xl last:rounded-r-xl"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400">
                      No athletes found
                    </td>
                  </tr>
                ) : (
                  paginated.map((a, i) => (
                    <tr
                      key={a.id}
                      className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-600">{a.joined}</td>
                      <td className="px-4 py-3">
                        <button className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors">
                          {a.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{a.videos}</td>
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

          {/* Pagination */}
          <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              <option value={50}>50</option>
              <option value={25}>25</option>
              <option value={10}>10</option>
            </select>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {[
                { label: "«««", action: () => setPage(1) },
                {
                  label: "«",
                  action: () => setPage((p) => Math.max(1, p - 1)),
                },
                {
                  label: "»",
                  action: () => setPage((p) => Math.min(totalPages, p + 1)),
                },
                { label: "»»»", action: () => setPage(totalPages) },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className="w-9 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-xs font-medium"
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
