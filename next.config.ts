import type { NextConfig } from "next";

const BOT_SERVICE_URL =
  process.env.BOT_SERVICE_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/* except /api/auth/* to the NestJS bot-service
        source: "/api/:path((?!auth).*)",
        destination: `${BOT_SERVICE_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
