import { defineConfig } from 'tsup';

export default defineConfig([
  // Electron build
  {
    entry: ['./electron/src/main.ts', './electron/src/preload.ts'],
    splitting: false,
    sourcemap: false,
    clean: true,
    cjsInterop: true,
    skipNodeModulesBundle: true,
    treeshake: true,
    outDir: 'build',
    external: ['electron'],
    format: ['cjs'],
    bundle: true,
  },

  // Script de Next.js (start.dev.ts)
  {
    entry: ['src/utils/start.dev.ts'],
    format: ['cjs'], // Así evitas el warning
    platform: 'node',
    outDir: 'build', // Puedes cambiarlo según prefieras
    sourcemap: false,
    minify: false,
    clean: false, // No limpies todo cuando compilas este archivo
    splitting: false,
    bundle: false, // No hace falta bundlear aquí
  }
]);
