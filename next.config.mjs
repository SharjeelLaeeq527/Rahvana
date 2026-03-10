// /** @type {import('next').NextConfig} */
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

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
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.fallback = { canvas: false }
    return config
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig