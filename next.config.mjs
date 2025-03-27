/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["npm-pkg-hook", "pkg-components"],
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  eslint: {
    ignoreDuringBuilds: true,
    reactStrictMode: false
  },
  typescript: {
    ignoreBuildErrors: true // Ignore TypeScript errors during builds
  },
};

export default nextConfig;
