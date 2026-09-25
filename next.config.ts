import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Arena/Vercel preview host is proxied through *.e2b.app during development.
  allowedDevOrigins: ["*.e2b.app", "localhost", "127.0.0.1"],
};

export default nextConfig;
