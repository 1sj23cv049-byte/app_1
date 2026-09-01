/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // Standalone output: lets the Docker image ship just the built server plus
  // the small set of files it actually needs, instead of the whole
  // node_modules tree. Required for the Dockerfile-based deploy — see
  // DEPLOY.md.
  output: 'standalone',
  experimental: { serverComponentsExternalPackages: ['better-sqlite3'] }
};

module.exports = nextConfig;
