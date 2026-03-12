"use client";

import React, { useState, useMemo } from "react";

// 1. Define the Video interface for type safety
interface Video {
  id: number;
  title: string;
  duration: string;
  size: string;
  format: string;
  uploadedAt: string;
  views: number;
  gradient: string;
  icon: string;
}

const dummyVideos: Video[] = [
  {
    id: 1,
    title: "Product Launch Keynote 2024",
    duration: "42:18",
    size: "1.2 GB",
    format: "MP4",
    uploadedAt: "Feb 14, 2026",
    views: 1240,
    gradient: "from-blue-400 via-blue-500 to-indigo-600",
    icon: "🎬",
  },
  {
    id: 2,
    title: "Team Onboarding - Q1 Overview",
    duration: "18:05",
    size: "540 MB",
    format: "MOV",
    uploadedAt: "Feb 13, 2026",
    views: 876,
    gradient: "from-violet-400 via-purple-500 to-fuchsia-600",
    icon: "📋",
  },
  {
    id: 3,
    title: "Customer Success Story - Acme Corp",
    duration: "6:47",
    size: "210 MB",
    format: "MP4",
    uploadedAt: "Feb 12, 2026",
    views: 3402,
    gradient: "from-sky-400 via-cyan-500 to-teal-500",
    icon: "⭐",
  },
  {
    id: 4,
    title: "Design System Walkthrough",
    duration: "31:22",
    size: "890 MB",
    format: "MKV",
    uploadedAt: "Feb 11, 2026",
    views: 567,
    gradient: "from-rose-400 via-pink-500 to-fuchsia-500",
    icon: "🎨",
  },
  {
    id: 5,
    title: "Engineering All Hands - February",
    duration: "1:02:14",
    size: "2.1 GB",
    format: "MP4",
    uploadedAt: "Feb 10, 2026",
    views: 214,
    gradient: "from-amber-400 via-orange-500 to-red-500",
    icon: "⚙️",
  },
  {
    id: 6,
    title: "Marketing Campaign Preview",
    duration: "3:55",
    size: "98 MB",
    format: "WebM",
    uploadedAt: "Feb 9, 2026",
    views: 5810,
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    icon: "📣",
  },
  {
    id: 7,
    title: "UX Research Session Recording",
    duration: "54:09",
    size: "1.6 GB",
    format: "MP4",
    uploadedAt: "Feb 8, 2026",
    views: 128,
    gradient: "from-indigo-400 via-blue-500 to-sky-500",
    icon: "🔬",
  },
  {
    id: 8,
    title: "Sales Training Module 3",
    duration: "22:41",
    size: "670 MB",
    format: "MOV",
    uploadedAt: "Feb 7, 2026",
    views: 931,
    gradient: "from-fuchsia-400 via-pink-400 to-rose-500",
    icon: "💼",
  },
  {
    id: 9,
    title: "Infrastructure Demo - AWS Setup",
    duration: "38:17",
    size: "1.0 GB",
    format: "MP4",
    uploadedAt: "Feb 6, 2026",
    views: 389,
    gradient: "from-teal-400 via-cyan-500 to-blue-500",
    icon: "☁️",
  },
];

// Fixed: Added type number to 'v'
const formatViews = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v;

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlayIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="white"
    stroke="white"
    strokeWidth="1"
  >
    <polygon points="5,3 19,12 5,21" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const GridIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>
);

const ListIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3" cy="6" r="1.5" fill="currentColor" />
    <circle cx="3" cy="12" r="1.5" fill="currentColor" />
    <circle cx="3" cy="18" r="1.5" fill="currentColor" />
  </svg>
);

// Fixed: Typed props for VideoCard
interface VideoCardProps {
  video: Video;
  view: string;
}

const VideoCard = ({ video, view }: VideoCardProps) => {
  const [hovered, setHovered] = useState(false);

  if (view === "list") {
    return (
      <div
        className="group flex items-center gap-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 p-3 cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className={`relative flex-shrink-0 w-28 h-16 rounded-xl bg-gradient-to-br ${video.gradient} flex items-center justify-center overflow-hidden`}
        >
          <span className="text-2xl">{video.icon}</span>
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
          >
            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <PlayIcon />
            </div>
          </div>
          <span className="absolute bottom-1 right-1.5 text-white text-[10px] font-semibold bg-black/40 rounded px-1.5 py-0.5">
            {video.duration}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
            {video.title}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <EyeIcon />
              {formatViews(video.views)} views
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400 text-xs">{video.size}</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400 text-xs">{video.format}</span>
          </div>
        </div>

        <div className="hidden sm:block text-right flex-shrink-0">
          <span className="text-xs text-gray-400">{video.uploadedAt}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={`relative w-full aspect-video bg-gradient-to-br ${video.gradient} flex items-center justify-center overflow-hidden`}
      >
        <span className="text-5xl drop-shadow-lg">{video.icon}</span>
        <div
          className={`absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <PlayIcon />
          </div>
        </div>
        <span className="absolute bottom-2 right-2.5 text-white text-xs font-semibold bg-black/50 rounded-md px-2 py-0.5 backdrop-blur-sm">
          {video.duration}
        </span>
        <span className="absolute top-2 left-2.5 text-white text-[10px] font-bold bg-blue-500/80 rounded-md px-2 py-0.5 backdrop-blur-sm tracking-wide">
          {video.format}
        </span>
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-800 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
          {video.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <EyeIcon />
              {formatViews(video.views)}
            </span>
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <ClockIcon />
              {video.size}
            </span>
          </div>
          <span className="text-[11px] text-gray-400">{video.uploadedAt}</span>
        </div>
      </div>
    </div>
  );
};

const ArchivedVideos = () => {
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");

  const filtered = useMemo(() => {
    let result = dummyVideos.filter((v) =>
      v.title.toLowerCase().includes(search.toLowerCase()),
    );
    if (sortBy === "newest") result = [...result].sort((a, b) => b.id - a.id);
    else if (sortBy === "oldest")
      result = [...result].sort((a, b) => a.id - b.id);
    else if (sortBy === "views")
      result = [...result].sort((a, b) => b.views - a.views);
    else if (sortBy === "name")
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    return result;
  }, [search, sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-500 rounded-2xl shadow-lg shadow-blue-200 mb-4">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Archived Videos
          </h1>
          <p className="text-gray-500 text-sm">
            These videos will get deleted after 30 days
          </p>
          <p className="text-gray-500 text-sm">
            {dummyVideos.length} videos archived
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search videos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-sm text-gray-700 placeholder-gray-400 transition-all"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-2.5 pl-3 pr-8 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm text-gray-600 cursor-pointer appearance-none transition-all"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 10px center",
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="views">Most viewed</option>
            <option value="name">A–Z</option>
          </select>

          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-white text-blue-500 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-white text-blue-500 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
            >
              <ListIcon />
            </button>
          </div>
        </div>

        {search && (
          <p className="text-sm text-gray-500 mb-4 px-1">
            {/* Fixed: Replaced raw " with &quot; */}
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for{" "}
            <span className="font-semibold text-gray-700">
              &quot;{search}&quot;
            </span>
          </p>
        )}

        {filtered.length > 0 ? (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                : "flex flex-col gap-3"
            }
          >
            {filtered.map((video) => (
              <VideoCard key={video.id} video={video} view={view} />
            ))}
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-sm p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#93C5FD"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              No videos found
            </h3>
            <p className="text-sm text-gray-400">
              Try adjusting your search terms
            </p>
            <button
              onClick={() => setSearch("")}
              className="mt-4 px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Clear search
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {[
            { label: "Total Videos", value: dummyVideos.length },
            { label: "Total Storage", value: "8.3 GB" },
            {
              label: "Total Views",
              value: formatViews(dummyVideos.reduce((a, v) => a + v.views, 0)),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-100 px-6 py-3 text-center"
            >
              <p className="text-xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArchivedVideos;
