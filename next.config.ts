import type { NextConfig } from "next";

const DJANGO_API = "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  /**
   * Proxy /products/ and /order/ to the Django backend.
   * The browser only ever sees localhost:3000 — no CORS issues.
   */
  async rewrites() {
    return [
      // Next.js strips trailing slashes before matching rewrites,
      // so sources must be without trailing slash.
      // Django receives the slash via the destination URL.
      {
        source: "/products",
        destination: `${DJANGO_API}/products/`,
      },
      {
        source: "/order",
        destination: `${DJANGO_API}/order/`,
      },
    ];
  },
};

export default nextConfig;
