"use client";
import React, { useState, ChangeEvent } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface SessionOrderSheet {
  id: string;
  createdDate: string;
  associatedFolder: string;
  orderSheetName: string;
  activities: number;
  athletes: number;
}

// ─── DUMMY DATA ──────────────────────────────────────────────────────────────
const DUMMY_SHEETS: SessionOrderSheet[] = [
  {
    id: "SOS001",
    createdDate: "2025-11-10",
    associatedFolder: "Sprint Training",
    orderSheetName: "Week 1 Sprint Session",
    activities: 6,
    athletes: 8,
  },
  {
    id: "SOS002",
    createdDate: "2025-11-24",
    associatedFolder: "Swimming Camp",
    orderSheetName: "Freestyle Drills - Nov",
    activities: 4,
    athletes: 5,
  },
  {
    id: "SOS003",
    createdDate: "2025-12-02",
    associatedFolder: "Gymnastics",
    orderSheetName: "Floor Routine Assessment",
    activities: 7,
    athletes: 3,
  },
  {
    id: "SOS004",
    createdDate: "2025-12-15",
    associatedFolder: "Athletics General",
    orderSheetName: "End of Term Evaluation",
    activities: 10,
    athletes: 12,
  },
  {
    id: "SOS005",
    createdDate: "2026-01-07",
    associatedFolder: "Badminton Club",
    orderSheetName: "Serve & Return Drills",
    activities: 5,
    athletes: 6,
  },
  {
    id: "SOS006",
    createdDate: "2026-01-18",
    associatedFolder: "Football Squad",
    orderSheetName: "Dribbling & Finishing Q1",
    activities: 8,
    athletes: 11,
  },
  {
    id: "SOS007",
    createdDate: "2026-02-01",
    associatedFolder: "Sprint Training",
    orderSheetName: "Week 9 Speed Ladder",
    activities: 5,
    athletes: 7,
  },
  {
    id: "SOS008",
    createdDate: "2026-02-10",
    associatedFolder: "Strength & Conditioning",
    orderSheetName: "Pre-Season Fitness Test",
    activities: 9,
    athletes: 14,
  },
];

// ─── ICONS ───────────────────────────────────────────────────────────────────
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
export default function SessionOrderSheetPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const filtered = DUMMY_SHEETS.filter(
    (s) =>
      s.orderSheetName.toLowerCase().includes(search.toLowerCase()) ||
      s.associatedFolder.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const start = filtered.length === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, filtered.length);

  const columns = [
    { label: "CREATED DATE", sortable: true },
    { label: "ASSOCIATED FOLDER", sortable: true },
    { label: "ORDER SHEET NAME", sortable: true },
    { label: "#ACTIVITIES", sortable: true },
    { label: "#ATHLETES", sortable: true },
    { label: "ACTIONS", sortable: true },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">
          Session Order Sheet
        </h1>

        {/* Add Button */}
        <div className="flex justify-center mb-6">
          <button className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-8 py-3.5 rounded-xl transition-colors shadow">
            <PlusIcon /> ADD A NEW SESSION ORDER SHEET
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          {/* Top Controls */}
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
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
                      colSpan={6}
                      className="text-center py-12 text-gray-400 bg-gray-50/50"
                    >
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  paginated.map((s, i) => (
                    <tr
                      key={s.id}
                      className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }`}
                    >
                      <td className="px-4 py-3 text-gray-600">
                        {s.createdDate}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {s.associatedFolder}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors text-left">
                          {s.orderSheetName}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-center">
                        {s.activities}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-center">
                        {s.athletes}
                      </td>
                      <td className="px-4 py-3">
                        <button className="flex items-center gap-1.5 bg-violet-400 hover:bg-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                          <WrenchIcon /> ACTIONS <ChevronDown />
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
