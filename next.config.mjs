import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide Next.js version fingerprint
  poweredByHeader: false,

  // NOTE: Strict mode disabled — it double-fires useEffect in dev, which causes
  // Zoom Meeting SDK to be initialized twice (silent crash). Re-enable only if
  // you switch away from Zoom embedded SDK.
  reactStrictMode: false,

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  // Security headers for all pages
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // SAMEORIGIN (not DENY) — Zoom Meeting SDK uses internal iframes; DENY breaks it
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            // Allow camera & microphone for Zoom — must be permissive on join pages
            value: "camera=*, microphone=*, geolocation=()",
          },
        ],
      },
    ];
  },

  // Compiler optimizations
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ["lucide-react", "react-hot-toast", "recharts"],
  },

  // Turbopack resolve aliases — stub internal Zoom SDK private modules
  turbopack: {
    resolveAlias: {
      "@zoom/download-manager": "./src/lib/zoom-download-manager-stub.js",
    },
  },

  // Webpack fallback for builds using webpack bundler
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@zoom/download-manager": path.resolve(
        __dirname,
        "src/lib/zoom-download-manager-stub.js"
      ),
    };
    return config;
  },
};

export default nextConfig;