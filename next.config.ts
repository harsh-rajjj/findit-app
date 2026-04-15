import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    // update these if your LAN IP changes
    "http://10.12.49.160:3000",
  ],
};

export default nextConfig;
