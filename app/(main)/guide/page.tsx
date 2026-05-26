"use client";
import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step {
  number: number;
  title: string;
  description: string;
}

interface AnalysisItem {
  name: string;
  icon: string;
  description: string;
}

interface ExtraContent {
  heading: string;
  items: AnalysisItem[];
}

interface Section {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  color: string;
  accent: string;
  steps: Step[];
  tips?: string[];
  extraContent?: ExtraContent;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  {
    id: "upload",
    icon: "⬆",
    title: "Uploading Videos",
    subtitle: "Import footage directly into your library",
    color: "from-blue-50 to-cyan-50",
    accent: "blue",
    steps: [
      {
        number: 1,
        title: "Navigate to Import / Upload Videos",
        description:
          "Click 'IMPORT/UPLOAD VIDEOS' in the left sidebar. This opens the upload workspace.",
      },
      {
        number: 2,
        title: "Select a destination folder (optional)",
        description:
          "Use the folder dropdown to choose where the video will be stored. You can also create a new folder inline by clicking 'New Folder'. If no folder is selected the video goes to the root library.",
      },
      {
        number: 3,
        title: "Add your video files",
        description:
          "Drag and drop one or more video files onto the upload zone, or click 'Choose Files' to browse. Supported formats: MP4, MOV, AVI, MKV, WMV, FLV, WebM, M4V, MPG, MPEG.",
      },
      {
        number: 4,
        title: "Upload and monitor progress",
        description:
          "Click 'Upload All' to start. Each file shows an individual progress bar. Uploads go directly to secure cloud storage — do not close the tab until all files show 'Done'.",
      },
    ],
    tips: [
      "Shorter, trimmed clips process faster and produce more accurate AI results.",
      "Organise videos into folders by athlete name, date, or drill type for easy retrieval.",
      "Videos are stored securely and are only visible to your account.",
    ],
  },
  {
    id: "videos",
    icon: "▶",
    title: "Managing Your Video Library",
    subtitle: "Browse, organise and watch your footage",
    color: "from-violet-50 to-purple-50",
    accent: "violet",
    steps: [
      {
        number: 1,
        title: "Open All Videos",
        description:
          "Click 'ALL VIDEOS' in the sidebar to see your full library. Videos are grouped by folder. Click a folder name to expand it.",
      },
      {
        number: 2,
        title: "Browse and search",
        description:
          "Use the search bar at the top to filter by video name. Click any video card to open the detail view.",
      },
      {
        number: 3,
        title: "Video detail view",
        description:
          "The detail view shows the video player, file metadata (size, format, upload date), and all analysis runs linked to that video. From here you can rename, move to a different folder, or delete the video.",
      },
      {
        number: 4,
        title: "Folder management",
        description:
          "Folders can be created, renamed, moved, or deleted from the All Videos page using the three-dot menu next to each folder. Deleting a folder also deletes all videos inside it.",
      },
    ],
    tips: [
      "Use the three-dot menu on a video card to quickly rename, move, or delete without opening the detail view.",
      "Videos remain in your library indefinitely — there is no automatic expiry.",
    ],
  },
  {
    id: "ai",
    icon: "✦",
    title: "AI Video Analysis",
    subtitle: "Extract performance metrics automatically with AI",
    color: "from-rose-50 to-orange-50",
    accent: "rose",
    steps: [
      {
        number: 1,
        title: "Open a video and go to Analysis",
        description:
          "From the All Videos page, click a video to open its detail view, then click the 'Analyse' or 'Process' button. You will be taken to the Analysis page for that video.",
      },
      {
        number: 2,
        title: "Choose an analysis type",
        description:
          "Select one of the six supported analysis types depending on the movement captured in the video. Each type uses a different AI model tailored to that specific drill.",
      },
      {
        number: 3,
        title: "Provide any required input",
        description:
          "Some analysis types need a short piece of additional information before processing. For example, Vertical Leap requires the athlete's standing height in centimetres so the AI can calculate jump height accurately.",
      },
      {
        number: 4,
        title: "Submit and wait for results",
        description:
          "Click 'Process'. The AI will analyse the video and return results within seconds to a few minutes depending on video length. The status will update from 'Pending' → 'Processing' → 'Completed'.",
      },
      {
        number: 5,
        title: "Read the results",
        description:
          "Once complete, a speed/metric chart appears alongside key statistics. Use the unit toggle (m/s ↔ km/h) to switch measurement units. All runs for a video are saved and can be compared over time.",
      },
    ],
    tips: [
      "Film the athlete from a stable, perpendicular angle for best accuracy.",
      "Ensure the full movement is visible — do not cut the start or end of the action.",
      "You can run multiple analysis types on the same video.",
      "Previous analysis runs are saved — scroll down on the Analysis page to see history.",
    ],
    extraContent: {
      heading: "Supported Analysis Types",
      items: [
        {
          name: "Fly Run",
          icon: "🏃",
          description:
            "Measures sprint speed across a flying start. Outputs max, min and average speed in m/s and km/h with a full speed-over-time chart.",
        },
        {
          name: "Vertical Leap",
          icon: "⬆",
          description:
            "Calculates jump height and flight time from a counter-movement jump. Requires the athlete's height as input.",
        },
        {
          name: "Horizontal Jump",
          icon: "↔",
          description:
            "Measures standing broad jump distance and flight time from a single explosive jump attempt.",
        },
        {
          name: "Step Length",
          icon: "👟",
          description:
            "Analyses running gait to extract step count, average step length, stride length and cadence (steps/min).",
        },
        {
          name: "Lateral Shuffle",
          icon: "↩",
          description:
            "Measures side-to-side agility: shuffle count, left/right symmetry, average width, shuffle speed and transition time.",
        },
        {
          name: "Single Leg Hop",
          icon: "🦵",
          description:
            "Assesses single-leg power and balance through a hopping movement sequence.",
        },
      ],
    },
  },
  {
    id: "reports",
    icon: "📊",
    title: "Reports",
    subtitle: "View aggregated results across all videos",
    color: "from-emerald-50 to-teal-50",
    accent: "emerald",
    steps: [
      {
        number: 1,
        title: "Open Reports",
        description:
          "Click 'REPORTS' in the sidebar. The reports page aggregates every completed analysis run from all your videos into a single sortable table.",
      },
      {
        number: 2,
        title: "Filter by analysis type",
        description:
          "Use the type filter dropdown to focus on one category (e.g. show only Vertical Leap runs). Each analysis type displays the metrics most relevant to that drill.",
      },
      {
        number: 3,
        title: "Interpret the data",
        description:
          "Each row shows the video name, analysis type, key output metrics and the date the analysis was run. Use this view to track progress over multiple sessions.",
      },
    ],
    tips: [
      "Run the same analysis type across multiple sessions on the same athlete to track improvement over time.",
      "Reports pull live data — any new completed analysis appears automatically.",
    ],
  },
  {
    id: "organisation",
    icon: "🏢",
    title: "Organisation & Members",
    subtitle: "Manage your team's profiles and data",
    color: "from-amber-50 to-yellow-50",
    accent: "amber",
    steps: [
      {
        number: 1,
        title: "Open Organisation Dashboard",
        description:
          "Click 'ORGANISATION' in the sidebar and select 'Organisation Dashboard'. You will see a summary of member counts broken down by role type.",
      },
      {
        number: 2,
        title: "Add a new member",
        description:
          "Click 'ADD NEW MEMBER' on the dashboard or the Member List page. Fill in the required fields: Member Type (required) and Full Name (required). All other fields — email, date of birth, gender, phone, sport, physical measurements, and custom metrics — are optional.",
      },
      {
        number: 3,
        title: "Member types available",
        description:
          "Each member must be assigned one of the nine types: Athlete, Coach, Analyst, Health Staff, Student, Patient, Player, Account Admin Manager, or Remote-Coach. The type determines how the member appears in filters and stats.",
      },
      {
        number: 4,
        title: "View and edit a member profile",
        description:
          "Click any member's name in the Member List to open their full profile page. From there you can toggle into edit mode to update any field, upload a profile photo, and manage which groups they belong to.",
      },
      {
        number: 5,
        title: "Upload a profile image",
        description:
          "On the member profile page, click '📷 Upload Photo' under Profile Image. Select a PNG, GIF, BMP, or JPG file. The image is uploaded directly to secure cloud storage and attached to the member's profile.",
      },
      {
        number: 6,
        title: "Delete a member",
        description:
          "Open the member's profile and click '🗑 DELETE', or use the ACTION menu in the Member List. Deletion is permanent and cannot be undone.",
      },
    ],
    tips: [
      "Click a stat card on the dashboard to jump straight to a filtered list of that member type.",
      "Physical measurements (height, weight, arm span, leg length, shoe size) are all in metric units (cm/kg).",
      "Use the 'Other Metrics' section to record any custom measurement not covered by the standard fields.",
      "The ACTION menu on each member row gives quick access to View Profile, Edit, Manage Groups and Delete.",
    ],
  },
  {
    id: "groups",
    icon: "👥",
    title: "Groups",
    subtitle: "Organise members into teams and cohorts",
    color: "from-sky-50 to-indigo-50",
    accent: "sky",
    steps: [
      {
        number: 1,
        title: "Open the Groups page",
        description:
          "Click 'GROUP' in the sidebar. You will see a list of all groups in your organisation along with their description and member count.",
      },
      {
        number: 2,
        title: "Create a new group",
        description:
          "Click 'ADD NEW GROUP'. Enter a group name (required) and an optional description, then click 'Create Group'. The group appears in the list immediately.",
      },
      {
        number: 3,
        title: "View group members",
        description:
          "Click the group's name in the table to open the Group Detail page. This shows all members currently assigned to that group with their role, sport and email.",
      },
      {
        number: 4,
        title: "Add members to a group",
        description:
          "On the Group Detail page, click 'ADD MEMBER TO GROUP'. A searchable list of all organisation members not already in the group appears — click '+ Add' next to any member to assign them instantly.",
      },
      {
        number: 5,
        title: "Remove a member from a group",
        description:
          "On the Group Detail page, use the ACTION menu on any member row and choose 'Remove from Group'. The member's account is not deleted — only the group assignment is removed.",
      },
      {
        number: 6,
        title: "Edit or delete a group",
        description:
          "Use the ACTION menu on the Groups list page and choose 'Edit Group' to rename or update the description, or 'Delete Group' to remove it. Deleting a group does not delete its members.",
      },
    ],
    tips: [
      "Members can belong to multiple groups simultaneously.",
      "Groups can also be managed directly from a member's profile page under the Groups section.",
      "Use the Manage Groups option in the Member List ACTION menu for a quick inline way to add or remove a member from groups without navigating away.",
    ],
  },
  {
    id: "athletes",
    icon: "🏃",
    title: "Athletes",
    subtitle: "Quick access to your athlete roster",
    color: "from-pink-50 to-fuchsia-50",
    accent: "pink",
    steps: [
      {
        number: 1,
        title: "Open the Athletes page",
        description:
          "Click 'ATHLETES' in the sidebar. This page shows only members with the type 'Athlete', filtered automatically from your full member list.",
      },
      {
        number: 2,
        title: "Search and filter",
        description:
          "Use the search bar to find an athlete by name. Use the group dropdown to show only athletes belonging to a specific group.",
      },
      {
        number: 3,
        title: "View an athlete's profile",
        description:
          "Click the athlete's name to open their full profile page, where you can view and edit all their details.",
      },
      {
        number: 4,
        title: "Add a new athlete",
        description:
          "Click 'ADD NEW ATHLETE'. This takes you to the Member List where you can add a new member — simply set the Member Type to 'Athlete' and the new member will appear on the Athletes page.",
      },
    ],
    tips: [
      "The Athletes page is a filtered view — any member typed as 'Athlete' appears here automatically.",
      "Use the ACTION menu to manage groups or delete an athlete without opening their profile.",
    ],
  },
];

// ─── Accent colour maps ───────────────────────────────────────────────────────

const ACCENT_COLORS: Record<string, { badge: string; dot: string; step: string; tip: string; border: string; tag: string }> = {
  blue:    { badge: "bg-blue-100 text-blue-700",    dot: "bg-blue-500",    step: "bg-blue-500 text-white",    tip: "bg-blue-50 border-blue-200 text-blue-800",    border: "border-blue-200",    tag: "text-blue-600" },
  violet:  { badge: "bg-violet-100 text-violet-700", dot: "bg-violet-500",  step: "bg-violet-500 text-white",  tip: "bg-violet-50 border-violet-200 text-violet-800", border: "border-violet-200", tag: "text-violet-600" },
  rose:    { badge: "bg-rose-100 text-rose-700",     dot: "bg-rose-500",    step: "bg-rose-500 text-white",    tip: "bg-rose-50 border-rose-200 text-rose-800",    border: "border-rose-200",    tag: "text-rose-600" },
  emerald: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", step: "bg-emerald-500 text-white", tip: "bg-emerald-50 border-emerald-200 text-emerald-800", border: "border-emerald-200", tag: "text-emerald-600" },
  amber:   { badge: "bg-amber-100 text-amber-700",   dot: "bg-amber-500",   step: "bg-amber-500 text-white",   tip: "bg-amber-50 border-amber-200 text-amber-800",   border: "border-amber-200",   tag: "text-amber-600" },
  sky:     { badge: "bg-sky-100 text-sky-700",       dot: "bg-sky-500",     step: "bg-sky-500 text-white",     tip: "bg-sky-50 border-sky-200 text-sky-800",       border: "border-sky-200",     tag: "text-sky-600" },
  pink:    { badge: "bg-pink-100 text-pink-700",     dot: "bg-pink-500",    step: "bg-pink-500 text-white",    tip: "bg-pink-50 border-pink-200 text-pink-800",    border: "border-pink-200",    tag: "text-pink-600" },
};

// ─── Nav pill ─────────────────────────────────────────────────────────────────

const NavPill = ({ section, active, onClick }: { section: Section; active: boolean; onClick: () => void }) => {
  const c = ACCENT_COLORS[section.accent];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 whitespace-nowrap
        ${active ? `${c.badge} shadow-sm scale-105` : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
    >
      <span>{section.icon}</span>
      <span className="hidden sm:inline">{section.title}</span>
    </button>
  );
};

// ─── Section card ─────────────────────────────────────────────────────────────

const SectionCard = ({ section }: { section: Section }) => {
  const c = ACCENT_COLORS[section.accent];
  const extra = section.extraContent;

  return (
    <div id={section.id} className={`bg-gradient-to-br ${section.color} rounded-3xl border ${c.border} p-6 md:p-8 mb-8 scroll-mt-24`}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-7">
        <div className={`w-12 h-12 rounded-2xl ${c.step} flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
          {section.icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{section.title}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{section.subtitle}</p>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4 mb-6">
        {section.steps.map((step) => (
          <div key={step.number} className="flex gap-4">
            <div className={`w-7 h-7 rounded-full ${c.step} flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm`}>
              {step.number}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{step.title}</p>
              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis type cards */}
      {extra && (
        <div className="mb-6">
          <p className={`text-xs font-bold uppercase tracking-widest ${c.tag} mb-3`}>{extra.heading}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {extra.items.map((item) => (
              <div key={item.name} className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/80 shadow-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-bold text-gray-800">{item.name}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {section.tips && section.tips.length > 0 && (
        <div className={`rounded-2xl border ${c.border} ${c.tip} p-4`}>
          <p className={`text-xs font-bold uppercase tracking-widest ${c.tag} mb-2.5`}>💡 Tips</p>
          <ul className="space-y-1.5">
            {section.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed">
                <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0 mt-1.5`} />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  const scrollTo = (id: string) => {
    setActiveId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky top nav */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {SECTIONS.map((s) => (
              <NavPill
                key={s.id}
                section={s}
                active={activeId === s.id}
                onClick={() => scrollTo(s.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-xs font-bold px-4 py-2 rounded-full mb-4 tracking-wide">
            📖 USER GUIDE
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
            How to use the Platform
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            Everything you need to know — from uploading footage and running AI analysis
            to building your team&apos;s member database and organising groups.
          </p>
        </div>

        {/* Quick-jump cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
          {SECTIONS.map((s) => {
            const c = ACCENT_COLORS[s.accent];
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`bg-gradient-to-br ${s.color} border ${c.border} rounded-2xl p-4 text-left hover:shadow-md transition-all duration-200 hover:scale-[1.02]`}
              >
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-sm font-bold text-gray-800 leading-tight">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-tight">{s.subtitle}</p>
              </button>
            );
          })}
        </div>

        {/* Sections */}
        {SECTIONS.map((s) => (
          <SectionCard key={s.id} section={s} />
        ))}

        {/* Footer */}
        <div className="text-center py-8 border-t border-gray-200 mt-4">
          <p className="text-sm text-gray-400">
            Need further help? Use the{" "}
            <a href="/support" className="text-violet-500 hover:text-violet-700 font-medium transition-colors">
              Support &amp; Feedback
            </a>{" "}
            page to get in touch.
          </p>
        </div>
      </div>
    </div>
  );
}