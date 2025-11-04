import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force dynamic rendering for all pages to avoid static generation errors
  output: 'standalone',

  // Skip static error page generation during build
  // This prevents build failures from prerendering errors
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Exclude packages with native dependencies from webpack bundling
  // This fixes build errors with discord.js and other native modules
  serverExternalPackages: [
    'discord.js',
    'zlib-sync',
    'better-sqlite3',
    'sharp',
    'canvas',
    'mongodb',
    'mysql2',
    'pg',
    'ioredis',
    'snoowrap',
    'bufferutil',
    'utf-8-validate',
  ],

  // Configure webpack to ignore native modules and optional dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle native modules on server
      config.externals.push({
        'discord.js': 'commonjs discord.js',
        'zlib-sync': 'commonjs zlib-sync',
        'better-sqlite3': 'commonjs better-sqlite3',
        'snoowrap': 'commonjs snoowrap',
      });
    }

    // Ignore optional dependencies that aren't installed
    config.resolve.alias = {
      ...config.resolve.alias,
      'bufferutil': false,
      'utf-8-validate': false,
    };

    // Suppress warnings about missing optional dependencies and conflicting exports
    config.ignoreWarnings = [
      /Module not found.*bufferutil/,
      /Module not found.*utf-8-validate/,
      /conflicting star exports/,
      /A Node\.js API is used/,
    ];

    return config;
  },
};

export default nextConfig;
