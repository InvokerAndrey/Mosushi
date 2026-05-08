import type { NextConfig } from "next";

const DJANGO_API = "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  /**
   * Proxy API calls and media files to the Django backend.
   * The browser only ever sees localhost:3000 — no CORS issues.
   */
  async rewrites() {
    return [
      { source: "/categories", destination: `${DJANGO_API}/categories/` },
      { source: "/products", destination: `${DJANGO_API}/products/` },
      { source: "/site-settings", destination: `${DJANGO_API}/site-settings/` },
      { source: "/order", destination: `${DJANGO_API}/order/` },
      { source: "/media/:path*", destination: `${DJANGO_API}/media/:path*` },
    ];
  },
};

export default nextConfig;
