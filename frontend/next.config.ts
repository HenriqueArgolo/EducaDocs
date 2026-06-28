import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const apiUrl = process.env.API_PROXY_TARGET || "http://127.0.0.1:8080";

    return [
      {
        source: "/backend/:path*",
        destination: `${apiUrl}/:path*`,
      },
      {
        source: "/unsplash-images/:path*",
        destination: "https://unsplash.com/:path*",
      },
    ];
  },
};

export default nextConfig;
