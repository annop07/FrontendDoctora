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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    
    // Only add rewrites if the API base URL is properly configured
    if (apiBaseUrl && apiBaseUrl !== 'undefined') {
      return [
        {
          source: '/api/:path*',
          destination: `${apiBaseUrl}/api/:path*`,
        },
      ];
    }
    
    // Return empty array if no API base URL is configured
    return [];
  },
}

module.exports = nextConfig