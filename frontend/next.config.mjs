/** @type {import('next').NextConfig} */
const API_ORIGIN = process.env.API_ORIGIN || "http://localhost:8080";

const nextConfig = {
  allowedDevOrigins: ["127.0.0.1", "0.0.0.0", "192.168.0.191"],
  devIndicators: false,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
  images: { unoptimized: true },
};

export default nextConfig;
