import type { NextConfig } from "next";

const DJANGO_API = process.env.DJANGO_API_URL ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  /**
   * Proxy API calls and media files to the Django backend.
   * The browser only ever sees localhost:3000 — no CORS issues.
   * Override the backend URL with DJANGO_API_URL env var (useful for production).
   */
  async rewrites() {
    return [
      { source: "/categories", destination: `${DJANGO_API}/categories/` },
      { source: "/products", destination: `${DJANGO_API}/products/` },
      { source: "/site-settings", destination: `${DJANGO_API}/site-settings/` },
      { source: "/info-blocks", destination: `${DJANGO_API}/info-blocks/` },
      { source: "/order", destination: `${DJANGO_API}/order/` },
      { source: "/media/:path*", destination: `${DJANGO_API}/media/:path*` },
    ];
  },
};

export default nextConfig;
