const nextConfig = {
  output: "standalone",
  transpilePackages: ["npm-pkg-hook", "pkg-components"],
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  },
  eslint: {
    ignoreDuringBuilds: true, // 🔹 Ignorar errores de ESLint en la build
  },
  reactStrictMode: false, // 🔹 Desactivar modo estricto de React
  typescript: {
    ignoreBuildErrors: true, // 🔹 Ignorar errores de TypeScript en la build
  },
  compiler: {
    reactRemoveProperties: true, // 🔹 Remueve propiedades problemáticas en producción
    removeConsole: true, // 🔹 Elimina console.log() en producción
    styledComponents: true,
     
  },
  experimental: {
    strictMode: false, // 🔹 Intenta forzar la desactivación del modo estricto
  }
};

export default nextConfig;
