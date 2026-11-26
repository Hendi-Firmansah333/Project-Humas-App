import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self' https://polihumas-api.vercel.app wss://polihumas-api.vercel.app https://api.cloudinary.com https://res.cloudinary.com https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com http://localhost:3001 ws://localhost:3001 http://127.0.0.1:3001 ws://127.0.0.1:3001",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Mengizinkan hot-reload dev dari localhost maupun network LAN / VirtualBox
  allowedDevOrigins: ["localhost:3000", "127.0.0.1:3000", "192.168.56.1:3000"],
  devIndicators: false,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@fullcalendar/core",
      "@fullcalendar/react",
      "@fullcalendar/daygrid",
      "@fullcalendar/timegrid",
      "@fullcalendar/interaction",
      "@base-ui/react",
      "framer-motion",
      "date-fns",
      "clsx",
      "tailwind-merge",
      "sonner",
      "@/components/common",
      "@/services",
    ],
  },
};

export default nextConfig;
