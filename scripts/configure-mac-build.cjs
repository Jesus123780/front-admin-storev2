
const fs = require('node:fs')

const arch = process.env.MAC_ARCH

if (!['arm64', 'x64'].includes(arch)) {
  throw new Error(
    `Arquitectura macOS no válida: ${arch}`
  )
}

const filename = `front-back-server-mac-${arch}`
const backendPath = `front-back-server/${filename}`

if (!fs.existsSync(backendPath)) {
  throw new Error(
    `No existe el backend para Mac: ${backendPath}`
  )
}

const packagePath = 'package.json'

const pkg = JSON.parse(
  fs.readFileSync(packagePath, 'utf8')
)

pkg.build ??= {}

const windowsResources = pkg.build.extraResources ?? []

// Los recursos Windows no deben empaquetarse en Mac.
delete pkg.build.extraResources

pkg.build.win = {
  ...pkg.build.win,
  extraResources:
    pkg.build.win?.extraResources ?? windowsResources
}

pkg.build.mac = {
  ...pkg.build.mac,
  category: 'public.app-category.business',
  target: ['dmg', 'zip'],
  extraResources: [
    {
      from: backendPath,
      to: filename
    }
  ]
}

fs.writeFileSync(
  packagePath,
  JSON.stringify(pkg, null, 2) + '\n'
)

console.info(
  `[Venty] Mac ${arch} configurado con ${filename}`
)
