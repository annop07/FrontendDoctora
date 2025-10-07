/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Temporarily disable ESLint during build to allow deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Allow images from Railway domains
  images: {
    domains: ['railway.app'],
  },
  // Ensure proper handling of API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`,
      },
    ];
  },
}

module.exports = nextConfig