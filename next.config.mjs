import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
/** ESM __dirname workaround */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: __dirname, // ✅ Root correcto para evitar warnings y builds fallidos

  transpilePackages: ["npm-pkg-hook", "pkg-components"],

  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_BUSINESS_TITLE: process.env.NEXT_PUBLIC_BUSINESS_TITLE,
    URL_ADMIN_SERVER: process.env.URL_ADMIN_SERVER,
    NEXT_PUBLIC_URL_BASE: process.env.NEXT_PUBLIC_URL_BASE,
    NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET: process.env.NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET,
  },

  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: true },

  compiler: {
    reactRemoveProperties: true,
    styledComponents: true,
  }
};

export default nextConfig;
