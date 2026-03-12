"use client";

import React from "react";
import { Video, Upload, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function WelcomeDashboard() {
  return (
    <div className="flex items-center justify-center min-h-full p-6">
      <div className="max-w-2xl w-full text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <Video size={40} className="text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome User
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Click on one of the menu items to start
          </p>

          <div className="flex justify-center gap-2 mb-8">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-150"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <Link
              href="/upload"
              className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-blue-100"
            >
              <Upload size={28} className="text-blue-600 mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-800 text-sm">
                Upload Videos
              </h3>
              <p className="text-xs text-gray-600 mt-2">
                Import and manage content
              </p>
            </Link>

            <Link
              href="/videos"
              className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-indigo-100"
            >
              <Video size={28} className="text-indigo-600 mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-800 text-sm">
                All Videos
              </h3>
              <p className="text-xs text-gray-600 mt-2">Browse your library</p>
            </Link>

            <Link
              href="/reports"
              className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-purple-100"
            >
              <BarChart3 size={28} className="text-purple-600 mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-800 text-sm">
                View Reports
              </h3>
              <p className="text-xs text-gray-600 mt-2">Analyze performance</p>
            </Link>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Need help? Visit the{" "}
          <Link
            href="/guide"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            User Guide
          </Link>
        </p>
      </div>
    </div>
  );
}
