"use client";
import React, { useState, ChangeEvent } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Group {
  id: string;
  name: string;
  description: string;
}

// ─── DUMMY DATA ──────────────────────────────────────────────────────────────
const DUMMY_GROUPS: Group[] = [
  {
    id: "GRP001",
    name: "Team Alpha",
    description: "Elite swimming and athletics squad",
  },
  {
    id: "GRP002",
    name: "Team Beta",
    description: "Gymnastics and precision sports group",
  },
  {
    id: "GRP003",
    name: "Junior Batch",
    description: "Under-18 development programme",
  },
  {
    id: "GRP004",
    name: "Senior Squad",
    description: "Advanced competitive athletes above 18",
  },
  {
    id: "GRP005",
    name: "Coaching Staff",
    description: "All registered coaches and assistant coaches",
  },
  {
    id: "GRP006",
    name: "Analytics Team",
    description: "Performance analysts and data specialists",
  },
  {
    id: "GRP007",
    name: "Badminton Club",
    description: "Recreational and competitive badminton players",
  },
  {
    id: "GRP008",
    name: "Football Squad",
    description: "Main football team for inter-org tournaments",
  },
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

const SortIcon = () => (
  <svg
    width="12"
    height="12"
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
export default function MyGroupPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = DUMMY_GROUPS.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const start = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, filtered.length);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">
          My Group
        </h1>

        {/* Add New Group Button */}
        <div className="flex justify-center mb-6">
          <button className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-8 py-3.5 rounded-xl transition-colors shadow">
            <PlusIcon /> ADD NEW GROUP
          </button>
        </div>

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
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 bg-gray-50 w-72">
              <input
                value={search}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search records"
                className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
              />
              <span className="text-gray-400">
                <SearchIcon />
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-400 text-white">
                  {[
                    { label: "GROUP NAME", sortable: true },
                    { label: "GROUP DESCRIPTION", sortable: true },
                    { label: "ACTION", sortable: true },
                  ].map((h) => (
                    <th
                      key={h.label}
                      className="px-4 py-3 text-left text-xs font-bold tracking-wider first:rounded-l-xl last:rounded-r-xl"
                    >
                      <div className="flex items-center gap-1.5">
                        {h.label}
                        {h.sortable && (
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
                      colSpan={3}
                      className="text-center py-12 text-gray-400 bg-gray-50/50"
                    >
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  paginated.map((g, i) => (
                    <tr
                      key={g.id}
                      className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <button className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors">
                          {g.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {g.description || "—"}
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
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium tracking-wide transition-colors"
              >
                FIRST
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium tracking-wide transition-colors"
              >
                PREVIOUS
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium tracking-wide transition-colors"
              >
                NEXT
              </button>
              <button
                onClick={() => setPage(totalPages || 1)}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium tracking-wide transition-colors"
              >
                LAST
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
