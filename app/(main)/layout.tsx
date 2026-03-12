"use client"

import React, { useEffect } from "react";
import Sidebar from "@/components/sidebar";
import type { Metadata } from "next";
import { getToken, removeToken } from "@/utils/lib/auth";
import { useRouter } from "next/navigation";

// export const metadata: Metadata = {
//   title: "Dashboard",
//   description: "Manage your athletic video content",
// };

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = getToken();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        router.push("/login");
        return;
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  if (token) {

    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Sidebar */}
      <Sidebar>{children}</Sidebar>
    </div>
  );
  }
}
