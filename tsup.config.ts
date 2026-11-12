import { defineConfig } from 'tsup'

export default defineConfig([
  // Mismo output que main="build/main.js" del package.json actual.
  {
    name: 'electron',
    entry: {
      main: './electron/src/main.ts',
      preload: './electron/src/preload.ts'
    },
    format: ['cjs'],
    platform: 'node',
    target: 'node20',
    splitting: false,
    sourcemap: false,
    clean: false,
    cjsInterop: true,
    skipNodeModulesBundle: true,
    treeshake: true,
    outDir: 'build',
    external: ['electron', 'electron-updater', 'electron-log'],
    bundle: true
  },
  // Conserva tu compilación actual del script auxiliar Next.js.
  {
    name: 'next-start',
    entry: { 'start.dev': 'src/utils/start.dev.ts' },
    format: ['cjs'],
    platform: 'node',
    outDir: 'build',
    sourcemap: false,
    minify: false,
    clean: false,
    splitting: false,
    bundle: false
  }
])
