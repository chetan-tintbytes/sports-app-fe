"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Video,
  Building2,
  Users,
  UserCircle,
  BarChart3,
  BookOpen,
  X,
  ChevronDown,
  LogOut,
  LucideProps,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { api } from "@/utils/lib/api";
import { getToken, removeToken } from "@/utils/lib/auth";
import { User } from "@/utils/types";

interface SubMenuItem {
  label: string;
  path: string;
}

interface MenuItem {
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  label: string;
  path: string;
  hasSubmenu?: boolean;
  subItems?: SubMenuItem[];
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    ORGANISATION: true,
  });
  const [user, setUser] = useState<User | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const profile = await api.getProfile(token);
        setUser(profile);
      } catch {
        removeToken();
        router.push("/login");
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  const adminMenuItems: MenuItem[] = [
    { icon: Upload, label: "IMPORT/UPLOAD VIDEOS", path: "/upload" },
    { icon: Video, label: "ALL VIDEOS", path: "/videos" },
    {
      icon: Building2,
      label: "ORGANISATION",
      path: "/organisation",
      hasSubmenu: true,
      subItems: [
        { label: "Organisation Dashboard", path: "/organisation/dashboard" },
        { label: "Member List", path: "/organisation/list" },
      ],
    },
    // { icon: Users, label: "GROUP", path: "/group" },
    { icon: UserCircle, label: "ATHLETES", path: "/athletes" },
    { icon: BarChart3, label: "REPORTS", path: "/reports" },
    { icon: BookOpen, label: "USER GUIDE", path: "/guide" },
  ];

  const memberMenuItems: MenuItem[] = [
    { icon: Upload, label: "IMPORT/UPLOAD VIDEOS", path: "/upload" },
    { icon: Video, label: "ALL VIDEOS", path: "/videos" },
    { icon: Users, label: "MEMBERS", path: "/organisation/list" },
    { icon: BarChart3, label: "REPORTS", path: "/reports" },
    { icon: BookOpen, label: "USER GUIDE", path: "/guide" },
  ];

  const menuItems = user?.is_admin ? adminMenuItems : memberMenuItems;

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const MenuItemComponent = ({ item }: { item: MenuItem }) => {
    const isExpanded = expandedMenus[item.label];
    return (
      <div className="mb-1">
        <Link
          href={item.path}
          className="flex items-center justify-between px-4 py-3 text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition-all duration-200 group"
          onClick={(e) => {
            if (item.hasSubmenu) {
              e.preventDefault();
              toggleSubmenu(item.label);
            } else {
              setIsSidebarOpen(false);
            }
          }}
        >
          <div className="flex items-center gap-3">
            <item.icon
              size={18}
              className="text-gray-400 group-hover:text-white"
            />
            <span className="text-xs font-medium tracking-wide">
              {item.label}
            </span>
          </div>
          {item.hasSubmenu && (
            <ChevronDown
              size={16}
              className={`text-gray-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          )}
        </Link>

        {item.hasSubmenu && isExpanded && item.subItems && (
          <div className="mt-1 ml-9 flex flex-col gap-1 border-l border-slate-700">
            {item.subItems.map((subItem, idx) => (
              <Link
                key={idx}
                href={subItem.path}
                onClick={() => setIsSidebarOpen(false)}
                className="block px-4 py-2 text-[11px] text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-md transition-colors"
              >
                {subItem.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-800 to-slate-900 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Profile section */}
          <div className="p-6 border-b border-slate-700">
            <Link
              href="/profile"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 group"
            >
              {/* Avatar */}
              <div className="w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                {user?.profile_image_url ? (
                  // Plain <img> avoids Next.js caching issues with short-lived presigned URLs
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profile_image_url}
                    alt={user.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white select-none">
                    {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
                  </span>
                )}
              </div>

              {/* Name + role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-white truncate group-hover:text-blue-300 transition-colors">
                    {user?.name ?? "Loading…"}
                  </span>
                  <ChevronDown
                    size={12}
                    className="text-gray-400 flex-shrink-0"
                  />
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-tighter mt-0.5">
                  {user?.is_admin ? "Admin" : user?.role_name || "Member"}
                </p>
              </div>
            </Link>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-slate-700">
            {menuItems.map((item, index) => (
              <MenuItemComponent key={index} item={item} />
            ))}
          </nav>

          {/* Logout button */}
          <div className="p-3 border-t border-slate-700">
            {!showLogoutConfirm ? (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-200 group"
              >
                <LogOut size={18} className="group-hover:text-red-400" />
                <span className="text-xs font-medium tracking-wide">
                  LOGOUT
                </span>
              </button>
            ) : (
              <div className="bg-slate-700/60 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-300 mb-3 text-center">
                  Sign out of your account?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-white border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </>
  );
}
