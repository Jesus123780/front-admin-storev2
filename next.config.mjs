const nextConfig = {
  output: "standalone",
  transpilePackages: ["npm-pkg-hook", "pkg-components"],
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXT_PUBLIC_BUSINESS_TITLE: process.env.NEXT_PUBLIC_BUSINESS_TITLE,
    URL_ADMIN_SERVER: process.env.URL_ADMIN_SERVER,
    NEXT_PUBLIC_URL_BASE: process.env.NEXT_PUBLIC_URL_BASE,
    NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET: process.env.NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET,
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
    // removeConsole: true, // 🔹 Elimina console.log() en producción
    styledComponents: true, // 🔹 Habilitar soporte para styled-components
  }
};

export default nextConfig;
