import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Backblaze B2 S3-compatible storage
        protocol: "https",
        hostname: "**.backblazeb2.com",
      },
      {
        // Standard AWS S3
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;