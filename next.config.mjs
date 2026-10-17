import path from "path";
import { fileURLToPath } from "url";

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
  // Hide the framework/version banner (X-Powered-By) so we don't advertise our
  // stack to attackers during reconnaissance.
  poweredByHeader: false,

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
          // Content Security Policy — blocks inline script injection & unauthorized origins
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",

              // Scripts
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://js.stripe.com https://www.googletagmanager.com",

              // Workers (required by canvas-confetti)
              "worker-src 'self' blob:",
              "child-src 'self' blob:",

              // Styles
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              // Fonts
              "font-src 'self' https://fonts.gstatic.com data:",

              // Images
              "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.google-analytics.com https://*.googletagmanager.com",

              // API/WebSocket connections
              "connect-src 'self' https://*.supabase.co https://*.stripe.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://rahvana-1.onrender.com wss://*.supabase.co http://localhost:8000 http://127.0.0.1:8000 ws://localhost:8000 ws://127.0.0.1:8000 https://api.geoapify.com",

              // Frames
              "frame-src 'self' blob: https://js.stripe.com https://*.uscis.gov https://*.state.gov https://*.cbp.dhs.gov https://*.ssa.gov",

              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      {
        // Allow framing only for the document preview route from the same origin
        source: "/api/documents/:id/preview",
        headers: [
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://js.stripe.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com",
              "connect-src 'self' https://*.supabase.co https://*.stripe.com https://*.google-analytics.com https://rahvana-1.onrender.com wss://*.supabase.co https://api.geoapify.com",
              "frame-src 'self' blob: https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
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
    root: __dirname,
    resolveAlias: {
      canvas: path.join(__dirname, "lib/mock-canvas.js"),
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
