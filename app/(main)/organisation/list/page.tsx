"use client";
import React, { useState, ChangeEvent } from "react";

// ─── TYPES ──────────────────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  type: string;
  email: string;
  dob: string;
  gender: string;
  phone: string;
  height: string;
  weight: string;
  armSpan: string;
  legLength: string;
  shoeSize: string;
  sport: string;
  joined: string;
  groups: string[];
}

// ─── DUMMY DATA ──────────────────────────────────────────────────────────────
const DUMMY_MEMBERS: Member[] = [
  {
    id: "VMDXOHC5P9",
    name: "Chetan Sharma",
    type: "Owner Member",
    email: "chetan@org.com",
    dob: "1990-05-12",
    gender: "Male",
    phone: "+91 98765 43210",
    height: "175 cm",
    weight: "72 kg",
    armSpan: "178 cm",
    legLength: "90 cm",
    shoeSize: "42",
    sport: "Football",
    joined: "2025-11-06",
    groups: [],
  },
  {
    id: "ATH001",
    name: "Ananya Patel",
    type: "Athlete",
    email: "ananya@org.com",
    dob: "2000-08-22",
    gender: "Female",
    phone: "+91 91234 56789",
    height: "162 cm",
    weight: "56 kg",
    armSpan: "165 cm",
    legLength: "82 cm",
    shoeSize: "37",
    sport: "Swimming",
    joined: "2025-12-01",
    groups: ["Team Alpha"],
  },
  {
    id: "COA002",
    name: "Rajesh Verma",
    type: "Coach",
    email: "rajesh@org.com",
    dob: "1985-03-10",
    gender: "Male",
    phone: "+91 99887 76655",
    height: "180 cm",
    weight: "80 kg",
    armSpan: "183 cm",
    legLength: "95 cm",
    shoeSize: "44",
    sport: "Athletics",
    joined: "2025-11-15",
    groups: ["Team Alpha", "Team Beta"],
  },
  {
    id: "ATH003",
    name: "Priya Mehta",
    type: "Athlete",
    email: "priya@org.com",
    dob: "2002-11-03",
    gender: "Female",
    phone: "+91 98001 23456",
    height: "158 cm",
    weight: "52 kg",
    armSpan: "160 cm",
    legLength: "80 cm",
    shoeSize: "36",
    sport: "Gymnastics",
    joined: "2026-01-05",
    groups: ["Team Beta"],
  },
  {
    id: "ANL004",
    name: "Suresh Kumar",
    type: "Analyst",
    email: "suresh@org.com",
    dob: "1992-07-19",
    gender: "Male",
    phone: "+91 70001 11223",
    height: "170 cm",
    weight: "68 kg",
    armSpan: "172 cm",
    legLength: "88 cm",
    shoeSize: "41",
    sport: "—",
    joined: "2025-12-20",
    groups: [],
  },
  {
    id: "STU005",
    name: "Meera Joshi",
    type: "Student",
    email: "meera@org.com",
    dob: "2004-02-14",
    gender: "Female",
    phone: "+91 80005 55667",
    height: "155 cm",
    weight: "48 kg",
    armSpan: "156 cm",
    legLength: "78 cm",
    shoeSize: "35",
    sport: "Badminton",
    joined: "2026-01-20",
    groups: [],
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
export default function MembersListPage() {
  const [search, setSearch] = useState("");
  const page = 1;
  const perPage = 50;

  const filtered = DUMMY_MEMBERS.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">
          My Organisation
        </h1>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <button className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow">
              <PlusIcon /> ADD NEW MEMBER
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              placeholder="Search Member Name"
              className="flex-1 text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
            />
            <SearchIcon />
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-violet-400 text-white">
                  {[
                    "CREATION DATE",
                    "MEMBER ID",
                    "MEMBER NAME",
                    "MEMBER TYPE",
                    "GROUPS",
                    "ACTION",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold tracking-wider first:rounded-l-xl last:rounded-r-xl"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-400">
                      No members found
                    </td>
                  </tr>
                ) : (
                  filtered
                    .slice((page - 1) * perPage, page * perPage)
                    .map((m, i) => (
                      <tr
                        key={m.id}
                        className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${
                          i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-600">{m.joined}</td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                          {m.id}
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors">
                            {m.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{m.type}</td>
                        <td className="px-4 py-3 text-gray-500">
                          {m.groups.join(", ") || "—"}
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

          {/* Pagination */}
          <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-300">
              <option>50</option>
              <option>25</option>
              <option>10</option>
            </select>
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {["«", "‹", "1", "›", "»"].map((p, i) => (
                <button
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    p === "1"
                      ? "bg-blue-500 text-white font-bold"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
