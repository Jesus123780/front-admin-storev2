/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["npm-pkg-hook", "pkg-components"],
  eslint: {
    ignoreDuringBuilds: true,
    ignoreDuringDev: true, // Opcional: Ignorar también en desarrollo
  },
  typescript: {
    ignoreBuildErrors: true, // Ignore TypeScript errors during builds
  },
};

export default nextConfig;
