/**
 * Ejecutar EN LA RAÍZ DEL REPO: node scripts/configure-package.mjs
 * Cambia solamente build.publish, dependencies.electron-updater y scripts
 * del package.json. No toca el resto de las opciones ni otras dependencias.
 * IMPORTANTE: después ejecutar npm install para actualizar package-lock.json.
 */
import fs from 'node:fs'
import path from 'node:path'

const file = path.resolve(process.cwd(), 'package.json')
if (!fs.existsSync(file)) {
  throw new Error('Ejecuta el script desde la raíz de front-admin-storev2')
}
const pkg = JSON.parse(fs.readFileSync(file, 'utf8'))
if (pkg.name !== 'nextjs_approuter_electron') {
  throw new Error(`El package.json no corresponde al proyecto esperado: ${pkg.name ?? 'sin nombre'}`)
}

pkg.dependencies = pkg.dependencies ?? {}
pkg.dependencies['electron-updater'] = '6.8.11'

pkg.build = pkg.build ?? {}
pkg.build.publish = [{
  provider: 'github',
  owner: 'Jesus123780',
  repo: 'front-admin-storev2'
}]

pkg.scripts = pkg.scripts ?? {}
pkg.scripts['electron:compile'] =
  'node -e "require(\'node:fs\').rmSync(\'build\', { recursive: true, force: true })" && tsup'
pkg.scripts.build = 'run-s next:build electron:compile electron:build'
pkg.scripts['electron:publish:win'] = 'electron-builder --win nsis --publish always'
pkg.scripts['release:win'] = 'run-s next:build electron:compile electron:publish:win'
// Usar --publish never en builds locales, para evitar publicación accidental.
pkg.scripts['electron:build'] = 'electron-builder --publish never'

const backup = `${file}.before-autoupdate.bak`
if (!fs.existsSync(backup)) fs.copyFileSync(file, backup)
fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
console.log('package.json actualizado. Backup:', backup)
console.log('Siguiente: npm install && npm run electron:compile')
