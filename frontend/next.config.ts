import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
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
