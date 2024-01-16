/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  env: {
    WEB_SOCKET_URL: process.env.WEB_SOCKET_URL,
  },
  images: {
    domains: ["vbvmmthyebnlbcfqglxn.supabase.co"],
    // remotePatterns: [
    //   {
    //     protocol: 'https',
    //     hostname: '',
    //     port: '',
    //     pathname: '/my-bucket/**',
    //   },
    // ],
  },
};

module.exports = nextConfig;
