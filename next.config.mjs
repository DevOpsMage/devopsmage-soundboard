/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  output: 'standalone',
  // Ensure proper handling of reverse proxy headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
  // Trust reverse proxy headers  
  poweredByHeader: false,
  // Handle trailing slashes consistently
  trailingSlash: false,
  // Ensure proper base path handling
  basePath: '',
};

export default nextConfig;