import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Security Headers
   * ─────────────────────────────────────────────────────────
   * Injected into every Next.js response (pages, API routes,
   * static assets). Mirrors the HSTS policy set by helmet
   * on the Express backend for consistency.
   */
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
