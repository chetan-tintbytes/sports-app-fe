import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SportsApp — Sign In",
  description: "Manage your athletic video content",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel: Brand / Dark sidebar-matching ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-shrink-0 flex-col bg-[#1a2035] relative overflow-hidden">
        {/* Subtle background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Glow orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl" />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg
                width="20"
                height="20"
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
            <span className="text-white font-bold text-xl tracking-tight">
              SportsApp
            </span>
          </div>

          {/* Feature highlights */}
          <div className="space-y-6">
            <div>
              <h2 className="text-white text-3xl font-bold leading-tight mb-3">
                Manage your
                <br />
                <span className="text-blue-400">athletic content</span>
                <br />
                in one place.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload, organise, and analyse video footage for athletes,
                coaches, and organisations.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {[
                { icon: "☁️", label: "Cloud video storage" },
                { icon: "⚡", label: "AI-powered analysis" },
                { icon: "👥", label: "Team & organisation tools" },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-base">
                    {icon}
                  </div>
                  <span className="text-slate-300 text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom footer */}
          <div className="mt-auto pt-10">
            <p className="text-slate-600 text-xs">
              © 2026 SportsApp. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form area ── */}
      <div className="flex-1 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex items-center justify-center p-6">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <span className="font-bold text-gray-800 text-lg">SportsApp</span>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
