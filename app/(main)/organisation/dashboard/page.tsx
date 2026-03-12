"use client";
import React, { useState, ChangeEvent } from "react";

// ─── INTERFACES ──────────────────────────────────────────────────────────────
interface RoleType {
  id: string;
  label: string;
  color: string;
  icon: string;
  count: number;
}

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

interface Metric {
  name: string;
  value: string;
}

type ViewState = "dashboard" | "members" | "profile" | "add";

// ─── DATA ────────────────────────────────────────────────────────────────────
const ROLE_TYPES: RoleType[] = [
  { id: "total", label: "Total Members", color: "teal", icon: "👥", count: 1 },
  { id: "k", label: "Total K Members", color: "indigo", icon: "👤", count: 0 },
  {
    id: "nonk",
    label: "Total Non K Members",
    color: "violet",
    icon: "👤",
    count: 1,
  },
  { id: "coach", label: "Coach", color: "pink", icon: "🏋️", count: 0 },
  { id: "athlete", label: "Athlete", color: "pink", icon: "🏃", count: 0 },
  { id: "analyst", label: "Analyst", color: "pink", icon: "📊", count: 0 },
  {
    id: "healthstaff",
    label: "Health Staff",
    color: "pink",
    icon: "🏥",
    count: 0,
  },
  { id: "student", label: "Student", color: "pink", icon: "🎓", count: 0 },
  { id: "patient", label: "Patient", color: "pink", icon: "🩺", count: 0 },
  { id: "player", label: "Player", color: "pink", icon: "🎮", count: 0 },
  {
    id: "adminmgr",
    label: "Account Admin Manager",
    color: "pink",
    icon: "⚙️",
    count: 0,
  },
  {
    id: "remcoach",
    label: "Remote-Coach",
    color: "pink",
    icon: "📡",
    count: 0,
  },
  { id: "owner", label: "Owner Member", color: "pink", icon: "👑", count: 1 },
];

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

const MEMBER_TYPES_FOR_FORM = [
  "Athlete",
  "Coach",
  "Analyst",
  "Health Staff",
  "Student",
  "Patient",
  "Player",
  "Account Admin Manager",
  "Remote-Coach",
  "Owner Member",
];
const SPORTS_LIST = [
  "Football",
  "Cricket",
  "Basketball",
  "Swimming",
  "Athletics",
  "Gymnastics",
  "Badminton",
  "Tennis",
  "Hockey",
  "Volleyball",
];
const GENDERS = ["Male", "Female", "Non-binary", "Prefer not to say"];

// ─── COLOUR MAP ──────────────────────────────────────────────────────────────
const colorMap: Record<
  string,
  { bg: string; icon: string; num: string; border: string }
> = {
  teal: {
    bg: "bg-teal-50",
    icon: "text-teal-500",
    num: "text-teal-600",
    border: "border-teal-100",
  },
  indigo: {
    bg: "bg-indigo-50",
    icon: "text-indigo-400",
    num: "text-indigo-500",
    border: "border-indigo-100",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-400",
    num: "text-violet-500",
    border: "border-violet-100",
  },
  pink: {
    bg: "bg-white",
    icon: "text-rose-400",
    num: "text-rose-500",
    border: "border-gray-100",
  },
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const PeopleIcon = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 40 30" fill="currentColor">
    <circle cx="14" cy="9" r="7" />
    <path d="M0 29c0-7.7 6.3-14 14-14s14 6.3 14 14" />
    <circle cx="28" cy="7" r="5.5" opacity=".7" />
    <path d="M22 29c0-5.5 3-10.2 7.5-12.4" opacity=".7" />
  </svg>
);

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

const BackIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15,18 9,12 15,6" />
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

// ─── STAT BADGE ──────────────────────────────────────────────────────────────
const StatBadge = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 text-center shadow-sm">
    <p className="text-xl font-bold text-gray-800">{value}</p>
    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
  </div>
);

// ─── ROLE CARD ───────────────────────────────────────────────────────────────
const RoleCard = ({
  role,
  onMembersList,
}: {
  role: RoleType;
  onMembersList: (role: RoleType) => void;
}) => {
  const c = colorMap[role.color] || colorMap.pink;
  return (
    <div
      className={`${c.bg} rounded-2xl border ${c.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}
    >
      <div className="p-5 flex items-center gap-4 min-h-[90px]">
        <PeopleIcon className={`w-10 h-8 flex-shrink-0 ${c.icon}`} />
        <div>
          <p className="text-gray-700 font-semibold text-sm leading-tight">
            {role.label}
          </p>
          <p className={`text-xl font-bold mt-1 ${c.num}`}>{role.count}</p>
        </div>
      </div>
      <div className="bg-gray-100/60 px-5 py-3 flex justify-center">
        <button
          onClick={() => onMembersList(role)}
          className="text-xs font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 px-5 py-1.5 rounded-full transition-colors"
        >
          Members list
        </button>
      </div>
    </div>
  );
};

// ─── VIEW: DASHBOARD ─────────────────────────────────────────────────────────
const DashboardView = ({
  onMembersList,
  onAddMember,
}: {
  onMembersList: (role: RoleType) => void;
  onAddMember: () => void;
}) => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-light text-gray-800 text-center mb-6 tracking-wide">
        Organisation Dashboard
      </h1>
      <div className="flex justify-center mb-8">
        <button
          onClick={onAddMember}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold tracking-widest px-6 py-3 rounded-full transition-colors shadow-lg"
        >
          <PlusIcon /> ADD NEW MEMBER
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ROLE_TYPES.map((role) => (
          <RoleCard key={role.id} role={role} onMembersList={onMembersList} />
        ))}
      </div>
    </div>
  </div>
);

// ─── VIEW: MEMBERS LIST ───────────────────────────────────────────────────────
const MembersListView = ({
  role,
  onBack,
  onAddMember,
  onMemberClick,
}: {
  role: RoleType;
  onBack: () => void;
  onAddMember: () => void;
  onMemberClick: (member: Member) => void;
}) => {
  const [search, setSearch] = useState("");
  const page = 1;
  const perPage = 50;

  const members = DUMMY_MEMBERS.filter((m) => {
    if (role.id === "total" || role.id === "k" || role.id === "nonk")
      return true;
    return (
      m.type.toLowerCase().replace(/\s|-/g, "") ===
      role.label.toLowerCase().replace(/\s|-/g, "")
    );
  });

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <BackIcon /> Back to Dashboard
        </button>
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">
          My Organisation
        </h1>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <button
              onClick={onAddMember}
              className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow"
            >
              <PlusIcon /> ADD NEW MEMBER
            </button>
            <button className="flex items-center gap-2 bg-violet-400 hover:bg-violet-500 text-white text-xs font-bold tracking-widest px-5 py-3 rounded-xl transition-colors shadow">
              <RefreshIcon /> REFRESH TO UPDATE MEMBER LIST
            </button>
          </div>
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
                        className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td className="px-4 py-3 text-gray-600">{m.joined}</td>
                        <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                          {m.id}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => onMemberClick(m)}
                            className="text-blue-500 hover:text-blue-700 hover:underline font-medium transition-colors"
                          >
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
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${p === "1" ? "bg-blue-500 text-white font-bold" : "hover:bg-gray-100"}`}
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
};

// ─── VIEW: MEMBER PROFILE ─────────────────────────────────────────────────────
const MemberProfileView = ({
  member,
  onBack,
}: {
  member: Member;
  onBack: () => void;
}) => {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  const stats = [
    ["Member ID", member.id],
    ["Type", member.type],
    ["Email", member.email],
    ["Phone", member.phone],
    ["Gender", member.gender],
    ["Date of Birth", member.dob],
    ["Sport", member.sport],
    ["Joined", member.joined],
  ];
  const physical = [
    ["Height", member.height],
    ["Weight", member.weight],
    ["Arm Span", member.armSpan],
    ["Leg Length", member.legLength],
    ["Shoe Size", member.shoeSize + " cm"],
  ];
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <BackIcon /> Back to Members List
        </button>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-5 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-300 to-pink-300 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white shadow-lg">
            {initials}
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">
            {member.name}
          </h2>
          <span className="inline-block mt-2 bg-rose-100 text-rose-600 text-xs font-semibold px-3 py-1 rounded-full">
            {member.type}
          </span>
          <div className="flex justify-center gap-4 mt-5 flex-wrap">
            <StatBadge label="Groups" value={member.groups.length || "0"} />
            <StatBadge label="Sessions" value="0" />
            <StatBadge label="Assessments" value="0" />
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-5">
          <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-4">
            Personal Profile
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
            {stats.map(([label, val]) => (
              <div key={label} className="border-b border-gray-50 pb-3">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-gray-700">{val}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-400 tracking-widest uppercase mb-4">
            Physical Profile
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {physical.map(([label, val]) => (
              <div
                key={label}
                className="bg-gray-50 rounded-2xl p-4 text-center border border-gray-100"
              >
                <p className="text-lg font-bold text-gray-800">{val}</p>
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── VIEW: ADD MEMBER FORM ────────────────────────────────────────────────────
const FormField = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="grid grid-cols-[160px_1fr] items-start gap-4 py-2">
    <label className="text-sm text-gray-600 font-medium pt-2.5">
      {label}
      {required && <span className="text-rose-400 ml-1">*</span>}
    </label>
    <div>{children}</div>
  </div>
);

const Input = ({
  placeholder,
  type = "text",
}: {
  placeholder?: string;
  type?: string;
}) => (
  <input
    type={type}
    placeholder={placeholder}
    className="w-full bg-gray-100 border-none rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 transition-all"
  />
);

const Select = ({
  placeholder,
  options = [],
}: {
  placeholder: string;
  options?: string[];
}) => (
  <div className="relative">
    <select
      defaultValue=""
      className="w-full bg-gray-100 border-none rounded-lg px-3.5 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-300 appearance-none pr-8 transition-all"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
      <ChevronDown />
    </span>
  </div>
);

const AddMemberView = ({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: () => void;
}) => {
  const [otherMetrics, setOtherMetrics] = useState<Metric[]>([
    { name: "", value: "" },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <BackIcon /> Back
        </button>
        <h1 className="text-2xl font-light text-gray-800 text-center mb-6">
          Add Member
        </h1>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
          <div className="mb-6">
            <FormField label="Member type:">
              <Select placeholder="Athlete" options={MEMBER_TYPES_FOR_FORM} />
            </FormField>
          </div>
          <div className="relative border border-gray-200 rounded-2xl p-6 mb-6">
            <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">
              Personal Profile
            </span>
            <div className="divide-y divide-gray-50">
              <FormField label="Profile Image:">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 border border-gray-300 text-xs text-gray-600 font-medium px-3 py-2 rounded-lg transition-colors">
                    Choose File
                    <input
                      type="file"
                      accept=".png,.gif,.bmp,.jpg,.jpeg"
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-400">No file chosen</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  (Please upload .png, .gif, .bmp, .jpg, .jpeg images only. Min
                  250×150px.)
                </p>
              </FormField>
              <FormField label="Name:" required>
                <Input placeholder="Member name" />
              </FormField>
              <FormField label="Email Address:">
                <Input placeholder="Email address" type="email" />
              </FormField>
              <FormField label="Date of Birth:">
                <div className="flex items-center gap-2">
                  <Input placeholder="Your Age" />
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    OR
                  </span>
                  <Input placeholder="Your date of birth" type="date" />
                </div>
              </FormField>
              <FormField label="Gender">
                <Select placeholder="Gender" options={GENDERS} />
              </FormField>
              <FormField label="Phone No:">
                <Input placeholder="Phone no" />
              </FormField>
              <FormField label="Main Sports:">
                <Select
                  placeholder="Please Select Main Sports"
                  options={SPORTS_LIST}
                />
              </FormField>
              <FormField label="Others Sports:">
                <Select
                  placeholder="Select other sports"
                  options={SPORTS_LIST}
                />
              </FormField>
            </div>
          </div>
          <div className="relative border border-gray-200 rounded-2xl p-6 mb-6">
            <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">
              Physical Profile
            </span>
            <div className="divide-y divide-gray-50">
              <FormField label="Cohort:">
                <Select
                  placeholder="Select Cohort"
                  options={["Cohort A", "Cohort B"]}
                />
              </FormField>
              <FormField label="Group/Team:">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Select
                      placeholder="Please Select Group"
                      options={["Team Alpha", "Team Beta"]}
                    />
                  </div>
                  <button className="text-xs text-blue-500 hover:text-blue-700 font-medium flex-shrink-0 transition-colors">
                    Please Create Group
                  </button>
                </div>
              </FormField>
              {[
                { label: "Height:", placeholder: "Height", unit: "cm" },
                { label: "Weight:", placeholder: "Weight", unit: "kg" },
                { label: "Arm Span:", placeholder: "Arm span", unit: "cm" },
                { label: "Leg Length:", placeholder: "Leg length", unit: "cm" },
              ].map((f) => (
                <FormField key={f.label} label={f.label}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Input placeholder={f.placeholder} />
                    </div>
                    <Select
                      placeholder={f.unit}
                      options={f.unit === "kg" ? ["kg", "lbs"] : ["cm", "in"]}
                    />
                  </div>
                </FormField>
              ))}
              <FormField label="Shoe Size:">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input placeholder="Shoe size" />
                  </div>
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    cm
                  </span>
                </div>
              </FormField>
            </div>
          </div>
          <div className="relative border border-gray-200 rounded-2xl p-6 mb-8">
            <span className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">
              Other metrics
            </span>
            <div className="space-y-3">
              {otherMetrics.map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 flex-shrink-0">
                    {i + 1}.
                  </span>
                  <input
                    placeholder="Enter Metric Name"
                    className="flex-1 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none"
                  />
                  <input
                    placeholder="Value"
                    className="w-28 bg-gray-100 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-300 border-none"
                  />
                  {i === otherMetrics.length - 1 && (
                    <button
                      onClick={() =>
                        setOtherMetrics([
                          ...otherMetrics,
                          { name: "", value: "" },
                        ])
                      }
                      className="text-xs text-blue-500 hover:text-blue-700 font-medium flex-shrink-0 transition-colors"
                    >
                      + Add New
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={onSubmit}
              className="bg-violet-400 hover:bg-violet-500 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow"
            >
              ADD
            </button>
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow">
              RESET
            </button>
            <button
              onClick={onBack}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold text-sm px-8 py-3 rounded-xl transition-colors shadow"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function OrganisationDashboard() {
  const [view, setView] = useState<ViewState>("dashboard");
  const [activeRole, setActiveRole] = useState<RoleType | null>(null);
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  const [prevView, setPrevView] = useState<ViewState>("dashboard");

  const goTo = (next: ViewState, prev: ViewState) => {
    setPrevView(prev);
    setView(next);
  };

  const handleBack = () => setView(prevView);
  const handleSubmit = () => setView(prevView);

  if (view === "members" && activeRole)
    return (
      <MembersListView
        role={activeRole}
        onBack={handleBack}
        onAddMember={() => goTo("add", "members")}
        onMemberClick={(m) => {
          setActiveMember(m);
          goTo("profile", "members");
        }}
      />
    );

  if (view === "profile" && activeMember)
    return <MemberProfileView member={activeMember} onBack={handleBack} />;

  if (view === "add")
    return <AddMemberView onBack={handleBack} onSubmit={handleSubmit} />;

  return (
    <DashboardView
      onMembersList={(role) => {
        setActiveRole(role);
        goTo("members", "dashboard");
      }}
      onAddMember={() => goTo("add", "dashboard")}
    />
  );
}
