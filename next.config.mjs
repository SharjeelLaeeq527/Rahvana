import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const nextConfig = {
//   webpack: (config) => {
//     config.resolve.alias.canvas = false;
//     config.resolve.alias.encoding = false;
//     config.resolve.fallback = {
//       ...config.resolve.fallback,
//       canvas: false,
//     };
//     return config;
//   },
//   // Use the new standard 'turbopack' key instead of 'experimental.turbo'
//   turbopack: {
//     resolve: {
//       alias: {
//         canvas: path.join(__dirname, 'lib/mock-canvas.js'),
//       },
//     },
//   },
// };

// export default nextConfig;

// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },

  // ============================
  // Security Headers
  // ============================
  async headers() {
    return [
      {
        // Apply to ALL routes
        source: "/(.*)",
        headers: [
          // Prevent your site from being embedded in iframes (clickjacking protection)
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME-type sniffing attacks
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer info sent with requests
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Block camera, microphone, geolocation access from this origin
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=()",
          },
          // Force HTTPS for 1 year (only active in production with real HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Basic XSS protection for older browsers
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // pdfjs-dist optionally requires the native `canvas` package on the server,
  // which has no prebuilt `canvas.node` binary here. Alias it away so the
  // bundler never enters the canvas package (browser pdfjs doesn't need it).
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },

  // Turbopack (used by `next build --turbopack`) doesn't accept `false` as an
  // alias, so point `canvas` at a harmless mock module instead.
  turbopack: {
    resolve: {
      alias: {
        canvas: path.join(__dirname, 'lib/mock-canvas.js'),
      },
    },
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  outputFileTracingIncludes: {
    "/api/**/*": ["./data/**/*"],
  },
};

export default nextConfig;
