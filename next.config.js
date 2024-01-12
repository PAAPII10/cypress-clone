/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
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
