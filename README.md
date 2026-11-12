# Venty — Aplicación de escritorio para punto de venta

> **Versión documentada:** `1.0.16` (según el `package.json` proporcionado).  
> **Repositorio:** [Jesus123780/front-admin-storev2](https://github.com/Jesus123780/front-admin-storev2)  
> **Estado de distribución:** pipeline de Windows con publicación por tag; pipeline de macOS para compilaciones de prueba. La publicación y actualización automática de macOS requieren trabajo adicional.

Venty es una aplicación de escritorio desarrollada con **Next.js App Router, React, TypeScript y Electron**, acompañada de un **backend local independiente** para funciones de punto de venta. En producción, Electron arranca el backend empaquetado y sirve la aplicación Next.js desde un servidor local; la ventana carga esa interfaz mediante `localhost`. El proyecto incorpora una interfaz de actualizaciones, conectada con `electron-updater` y GitHub Releases.

Este documento reemplaza las instrucciones del boilerplate original basadas en `make` y `pnpm`: **los scripts reales del proyecto se ejecutan con `npm`**.

## Contenido

1. [Tecnologías y arquitectura](#tecnologías-y-arquitectura)
2. [Requisitos previos](#requisitos-previos)
3. [Instalación y desarrollo local](#instalación-y-desarrollo-local)
4. [Estructura y configuración](#estructura-y-configuración)
5. [Pruebas y verificaciones](#pruebas-y-verificaciones)
6. [Compilación local para macOS](#compilación-local-para-macos)
7. [Compilación para Windows](#compilación-para-windows)
8. [GitHub Actions y publicación](#github-actions-y-publicación)
9. [Crear y publicar un nuevo tag](#crear-y-publicar-un-nuevo-tag)
10. [Actualizaciones automáticas](#actualizaciones-automáticas)
11. [Problemas habituales](#problemas-habituales)
12. [Seguridad y recomendaciones](#seguridad-y-recomendaciones)

## Tecnologías y arquitectura

| Componente | Tecnología / función |
| --- | --- |
| Frontend | Next.js `15.2.4` (App Router, SSR/RSC), React `19`, TypeScript |
| Aplicación de escritorio | Electron `31.3.1` |
| Empaquetado | `electron-builder` `24.13.3`, `tsup` |
| Actualizaciones | `electron-updater` `6.8.11`, `electron-log` |
| Datos y consultas frontend | Apollo Client, TanStack React Query |
| Backend local | Repositorio separado `foodi-app-org/front-back-server` |
| Backend empaquetado | `@yao-pkg/pkg` (utilizado en los workflows), ejecutable nativo por plataforma |
| Distribución | GitHub Actions y GitHub Releases |

```text
GitHub Releases
       │ (manifiestos y paquetes por sistema)
       ▼
Electron Main ── electron-updater
       │ eventos IPC
       ▼
preload.ts ── window.updater
       │
       ▼
useElectronUpdater (npm-pkg-hook)
       │
       ▼
ElectronUpdateModal (Next.js / React)

Al iniciar Venty empaquetado:
Electron ──► backend local nativo
         └─► servidor Next.js standalone ──► ventana Electron
```

En `electron/src/main.ts`, la ventana utiliza `nodeIntegration: false`, `contextIsolation: true` y un `preload` que expone una API delimitada para el actualizador. El backend local y el servidor Next.js son procesos/servicios diferentes; una compilación de frontend correcta no garantiza que el backend empaquetado funcione.

## Requisitos previos

- **Node.js 22** y npm compatible (los workflows de CI utilizan Node 22).
- Git y acceso a los repositorios de frontend y backend.
- macOS para generar y probar binarios macOS; Windows o el runner Windows de GitHub para NSIS.
- Para compilar dependencias nativas: herramientas de compilación del sistema y **Python 3.11** (utilizado por el CI).
- Para distribuir a clientes Mac: membresía Apple Developer, certificado `Developer ID Application`, firma y notarización.

> Los comandos siguientes suponen una terminal situada en la raíz de `front-admin-storev2`. No subas archivos `.env`, certificados, tokens ni datos de clientes al repositorio.

## Instalación y desarrollo local

### 1. Clonar e instalar

```bash
git clone git@github.com:Jesus123780/front-admin-storev2.git
cd front-admin-storev2
nvm use 22                   # o nvm install 22 && nvm use 22
npm ci
```

Si ya tienes el repositorio, evita volver a clonarlo. `npm ci` instala según `package-lock.json` y ejecuta el `postinstall` que prepara las dependencias de Electron.

### 2. Preparar el entorno

Configura las variables exigidas por el frontend y el backend según el entorno correspondiente. La configuración actual de Next.js hace referencia, entre otras, a:

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_BUSINESS_TITLE`
- `URL_ADMIN_SERVER`
- `NEXT_PUBLIC_URL_BASE`
- `NEXT_PUBLIC_URL_ADMIN_SERVER_SOCKET`
- `NEXT_LOCAL_SALES_STORE`

**Aviso de seguridad:** `next.config.mjs` incluye `NEXTAUTH_SECRET` dentro de `env`; Next.js puede incorporar estos valores al bundle. Revisa y elimina la exposición de secretos antes de distribuir aplicaciones. Nunca empaquetes claves privadas en el cliente. No se documentan valores reales aquí.

### 3. Iniciar el entorno de desarrollo

El script principal disponible es:

```bash
npm run dev
```

Inicia Next.js en el puerto **3000** y luego Electron cuando el servidor responde. Existe además:

```bash
npm run next:dev
```

Este último ejecuta `electron/src/start.next-dev.js`, un iniciador alternativo del proyecto. Para probar Next.js por separado:

```bash
npx next dev -p 3000
```

En desarrollo, la aplicación puede requerir que el backend se ejecute por separado y esté configurado según las URLs/puertos locales. **`npm run dev` no equivale al instalador completo con backend nativo**.

### 4. Compilar el frontend y Electron por separado

```bash
npm run next:build
npm run electron:compile
```

Comprueba los archivos esperados:

```bash
test -f .next/standalone/server.js
test -f build/main.js
test -f build/preload.js
```

`next.config.mjs` utiliza `output: 'standalone'`; `electron-builder` incorpora `.next/standalone`, `.next/static`, `public` y `build` al paquete.

## Estructura y configuración

```text
front-admin-storev2/
├── src/
│   ├── app/                          # Next.js App Router
│   └── components/
│       └── ElectronUpdateModal/      # Interfaz de actualizaciones
├── electron/
│   └── src/
│       ├── main.ts                   # Ventana, servidores y updater
│       ├── preload.ts                # Bridge IPC
│       ├── services/
│       │   ├── autoUpdater.ts        # Búsqueda, descarga e instalación
│       │   ├── startBackend.ts       # Ejecutable backend por plataforma
│       │   └── startNextServer.ts    # Servidor Next.js empaquetado
│       └── shared/
├── scripts/
│   └── configure-mac-build.cjs       # Ajusta recursos para el build Mac
├── .github/workflows/
│   ├── electron-release-windows.yml
│   └── electron-build-macos.yml
├── front-back-server/               # Ejecutables del backend (generados)
├── .next/                            # Salida de Next.js (generada)
├── build/                            # Salida de tsup (generada)
├── dist/                             # Artefactos Electron Builder
├── next.config.mjs
└── package.json
```

### Configuración de Electron Builder

El `package.json` define actualmente:

- `appId`: `com.saybackend.nextjs-electronJ`
- `executableName`: `NextJSElectronJ`
- Windows: instalador **NSIS** (`.exe`), con accesos directos y elección de carpeta.
- `publish`: proveedor GitHub, repositorio `Jesus123780/front-admin-storev2`.
- `extraResources` base: `front-back-server/front-back-server.exe`.
- En Mac, `scripts/configure-mac-build.cjs` reemplaza los recursos de Windows por el backend nativo y configura objetivos `.dmg` y `.zip`.

**Atención:** el script de Mac *modifica `package.json` localmente*. Utiliza una rama de prueba y revisa `git diff -- package.json` antes de hacer commit. Evita empaquetar macOS con la configuración Windows sin haber generado el ejecutable correspondiente.

## Pruebas y verificaciones

```bash
npm run type-check
npm run lint
npm run test:next
npm run test:electron
npm test
npm run next:build
```

Pruebas end-to-end:

```bash
npm run e2e
npm run e2e:report
```

`npm run check` agrupa lint y verificación de tipos. El proyecto tiene algunas comprobaciones de TypeScript/ESLint deshabilitadas durante `next build` en `next.config.mjs`; por ello, ejecutar `npm run next:build` **no sustituye** `npm run check` ni las pruebas.

## Compilación local para macOS

Esta sección genera una aplicación de **prueba local**, no una distribución firmada para clientes. El backend debe empaquetarse para la arquitectura elegida; el `.exe` de Windows no funciona en Mac.

### 1. Confirmar arquitectura y herramientas

```bash
uname -m
node -v
python3 --version
export MAC_ARCH="$(node -p 'process.arch')"
echo "$MAC_ARCH"          # arm64 o x64
```

En Mac Apple Silicon, utiliza Node ARM64 si deseas generar un paquete ARM64. Si ejecutas Node mediante Rosetta, `process.arch` puede dar `x64`.

### 2. Descargar y compilar el backend

```bash
# Desde la raíz del frontend; solo la primera vez:
git clone https://github.com/foodi-app-org/front-back-server.git backend-source

cd backend-source
npm ci
npm run prepare-build
test -f build/server.js
```

El workflow de GitHub prepara temporalmente `backend-source/package.json` para `@yao-pkg/pkg`. Para reproducirlo localmente, **en tu rama de prueba del backend**, ejecuta:

```bash
node <<'NODE'
const fs = require('node:fs')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
pkg.bin = { server: 'build/server.js' }
pkg.pkg = {
  scripts: ['build/**/*.js'],
  assets: [
    'build/**/*.gql', 'build/**/*.graphql',
    'public/**/*', 'config/**/*',
    'src/api/lib/types/**/*', 'build/api/lib/types/**/*',
    'node_modules/sequelize/lib/**/*.js',
    'node_modules/sqlite3/**/*'
  ]
}
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
NODE
```

Desde `backend-source/`:

```bash
mkdir -p ../front-back-server
npx --yes @yao-pkg/pkg@6.25.0 . \
  --sea \
  --targets "node22-macos-${MAC_ARCH}" \
  --output "../front-back-server/front-back-server-mac-${MAC_ARCH}"
chmod +x "../front-back-server/front-back-server-mac-${MAC_ARCH}"
cd ..
```

> Este procedimiento es experimental: dependencias nativas como SQLite pueden requerir ajustes. Si `backend-source` ya existe, reutilízalo. No incluyas `.env` ni secretos en el ejecutable destinado a clientes. Revisa las dependencias, licencias y recursos empaquetados.

### 3. Generar Next.js y Electron

```bash
npm ci
npm run next:build
npm run electron:compile
node scripts/configure-mac-build.cjs
```

Verifica el ejecutable:

```bash
test -f "front-back-server/front-back-server-mac-${MAC_ARCH}"
```

### 4. Empaquetar sin publicar

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false \
  npx electron-builder --mac dmg zip --"$MAC_ARCH" --publish never
```

Los resultados suelen guardarse en `dist/`. Encuentra el `.app` exacto:

```bash
find dist -maxdepth 3 -name '*.app' -print
```

Para abrirlo, utiliza la ruta devuelta por `find`. Por ejemplo, en Apple Silicon:

```bash
open 'dist/mac-arm64/NextJSElectronJ.app'
```

El nombre/carpeta pueden variar con la configuración y versión de `electron-builder`. Si macOS impide abrir la aplicación sin firma, **no desactives de forma general Gatekeeper para los clientes**; prepara firma y notarización. Prueba que Next.js y el backend arranquen, que haya conectividad local y que no se afecten datos reales.

## Compilación para Windows

El camino reproducible recomendado es **GitHub Actions**, que genera el backend `front-back-server.exe` en Windows, compila Next.js y Electron, y crea un instalador NSIS.

Para empaquetar manualmente en un entorno Windows que **ya tenga**:

- `.next/standalone/server.js`,
- `build/main.js` y `build/preload.js`,
- `front-back-server/front-back-server.exe` construido para Windows,

puedes ejecutar:

```powershell
npx electron-builder --win nsis --publish never
```

El comando **no compila automáticamente el backend**. Si falta `front-back-server.exe`, reproduce los pasos de backend del workflow `.github/workflows/electron-release-windows.yml` o utiliza GitHub Actions. No uses un ejecutable macOS en Windows.

## GitHub Actions y publicación

### Windows — `.github/workflows/electron-release-windows.yml`

- **`workflow_dispatch`**: genera un instalador de prueba en **Actions → Artifacts**, sin publicarlo.
- **Push de un tag `v*`**: compila y publica el instalador `.exe`, `latest.yml` y `.blockmap` en una **GitHub Release**.
- Un push normal a `main` no publica un instalador.
- El workflow comprueba que la Release del tag todavía no exista; evita reutilizar etiquetas publicadas para reemplazar artefactos sin un procedimiento deliberado.

### macOS — `.github/workflows/electron-build-macos.yml`

- **`workflow_dispatch`** o **push de tag `v*`**: genera artefactos de prueba por arquitectura.
- Matriz: `x64` en `macos-15-intel` y `arm64` en `macos-15` (según la revisión actual del workflow).
- Genera `.dmg`, `.zip`, `latest-mac.yml` y posibles `.blockmap`, guardados en **Actions → Artifacts**.
- Utiliza **`--publish never`** y `contents: read`: **no incorpora automáticamente esos archivos a GitHub Releases**.
- Configura `CSC_IDENTITY_AUTO_DISCOVERY=false`; este proceso de prueba no debe considerarse una distribución macOS firmada y notarizada.

**Artifacts de Actions ≠ Assets de Releases.** Que un workflow termine en verde no significa que los clientes puedan descargar actualizaciones. No publiques manifiestos de Intel y Apple Silicon sin validar que correspondan a los ZIP correctos y sus sumas de verificación.

Accesos:

- [GitHub Actions](https://github.com/Jesus123780/front-admin-storev2/actions)
- [Releases](https://github.com/Jesus123780/front-admin-storev2/releases)

## Crear y publicar un nuevo tag

**Ejemplo: publicar `v1.0.16` desde una versión anterior.** Si tu `package.json` ya dice `1.0.16`, **omite** el paso de `npm version`; no lo ejecutes dos veces. Si `v1.0.16` ya existe en GitHub, **no lo recrees ni lo muevas**: prepara `v1.0.17` u otra versión posterior.

### 1. Comprobar y sincronizar Git

```bash
git status
git branch --show-current
git fetch origin --tags
```

Con un árbol de trabajo limpio y estando en `main`:

```bash
git switch main
git pull --rebase origin main
```

Si Git indica ramas divergentes o conflictos, resuélvelos primero. **No utilices `git reset --hard` ni `git push --force` como solución automática.**

### 2. Actualizar la versión (solo si hace falta)

```bash
node -p 'require("./package.json").version'
```

Si todavía es una versión inferior a `1.0.16`:

```bash
npm version 1.0.16 --no-git-tag-version
```

Asegúrate de que `package.json` y `package-lock.json` tengan la misma versión.

### 3. Validar antes de publicar

```bash
npm ci
npm run check
npm test
npm run next:build
npm run electron:compile
```

Las pruebas deben terminar satisfactoriamente antes de crear el tag. Si falla cualquier comando, corrige el problema antes de continuar.

### 4. Crear el commit de versión (si hay cambios)

```bash
git add package.json package-lock.json
git diff --cached
git commit -m "chore(release): v1.0.16"
git push origin main
```

Si los archivos ya están versionados en `1.0.16` y no hay cambios, no necesitas crear un commit vacío.

### 5. Crear el tag **sobre el commit correcto**

```bash
git status
git log -1 --oneline
git tag --list 'v1.0.16'
```

Si el tag **no existe** y `HEAD` es exactamente el commit que quieres publicar:

```bash
git tag -a v1.0.16 -m "Venty v1.0.16"
git push origin v1.0.16
```

Una vez publicado, no muevas ni sobrescribas el tag. El pipeline usa el código y workflow tal como quedaron en el commit etiquetado, no necesariamente el `main` más reciente.

### 6. Validar la publicación

1. Abre [GitHub Actions](https://github.com/Jesus123780/front-admin-storev2/actions).
2. Inspecciona los workflows que se dispararon con `v1.0.16`.
3. Abre [GitHub Releases](https://github.com/Jesus123780/front-admin-storev2/releases) y verifica el instalador Windows y `latest.yml`.
4. Si ejecutaste macOS, descarga los artefactos de prueba desde Actions. **No esperes que aparezcan automáticamente en la Release con la configuración actual.**
5. Instala en un equipo de prueba y valida arranque, backend, venta de prueba, datos locales y actualización desde una versión anterior.

> Para una futura versión, sustituye `1.0.16` por el siguiente número en todos los pasos. No publiques una versión si los paquetes destinados a clientes no están completos.

## Actualizaciones automáticas

En la aplicación **empaquetada** de Windows o macOS, `initializeAutoUpdater()` registra los canales IPC, verifica GitHub al arrancar y escucha eventos de `electron-updater`. Configuración actual:

```ts
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.allowPrerelease = false
autoUpdater.allowDowngrade = false
```

**Flujo:** abrir Venty → `checkForUpdates()` → recibir `available` → descargar → recibir `downloading` y `downloaded` → mostrar modal → usuario confirma **Reiniciar e instalar** → `quitAndInstall(false, true)`.

Los eventos viajan por `electron/src/preload.ts` al hook `useElectronUpdater` de `npm-pkg-hook`, y de ahí a `src/components/ElectronUpdateModal/index.tsx`.

Las comprobaciones reales están deshabilitadas en desarrollo (`app.isPackaged === false`); cambiar la versión de `package.json` mientras ejecutas `npm run dev` **no reproduce** una actualización real.

### Requisitos para actualizar macOS

- La versión instalada debe contener un actualizador habilitado para `darwin`. Las versiones antiguas que desactivaban macOS necesitarán **instalación manual inicial**.
- La aplicación debe estar firmada de forma compatible y notarizada para distribución normal.
- La Release debe contener metadatos y paquetes correctos para macOS, especialmente `latest-mac.yml` y los `.zip` correspondientes a las arquitecturas ofrecidas.
- La actualización debe probarse desde una instalación previa real, no solo mostrando el modal de demostración.

**Recomendación POS:** mantener la confirmación del usuario antes de reiniciar, para no interrumpir una venta. Añadir una comprobación periódica controlada sería una mejora futura, ya que el flujo actual comprueba al inicio.

## Problemas habituales

| Síntoma | Causa probable | Qué revisar |
| --- | --- | --- |
| `Cannot find latest-mac.yml` / HTTP 404 | La Release solo tiene archivos de Windows o faltan assets Mac | Revisar **Releases → Assets** y el estado de publicación macOS |
| Workflow Mac permanece `queued` | Etiqueta de runner no disponible/incorrecta o restricciones de capacidad | Usar `macos-15` para ARM64 y `macos-15-intel` para x64; revisar permisos/uso |
| Errores de actualización demasiado técnicos | Se muestra literalmente el error IPC | Mostrar mensaje amigable en UI y conservar detalle en `electron-log` |
| Error `Unknown regular expression flags` | Regex mal escapada en TSX | Evitar expresiones mal escapadas; verificar `npm run next:build` |
| `git pull` informa ramas divergentes | Commits locales y remotos distintos | Revisar `git status`; decidir `git pull --rebase origin main` si corresponde |
| No aparece el modal en desarrollo | `app.isPackaged === false` | Probar un paquete instalado o el modo preview de UI |
| Se abre Electron pero falla el backend | Ejecutable faltante/incompatible o dependencia nativa | Verificar arquitectura, `extraResources`, permisos y logs |
| El build Mac termina pero no hay Release Mac | `--publish never` | Implementar pipeline de publicación firmado y coordinado |
| `npm run next:build` termina sin alertas de tipos | TypeScript/ESLint ignorados en el build | Ejecutar `npm run check` por separado |

Para ver la arquitectura actual y los errores del actualizador, consulta `electron/src/services/autoUpdater.ts`. Los mensajes técnicos completos se registran con `electron-log`; la interfaz debe mostrar descripciones comprensibles para usuarios finales.

## Seguridad y recomendaciones

- No incluyas `.env`, credenciales, tokens ni certificados en commits, artefactos o ejecutables distribuidos.
- Revisa especialmente la configuración `env` de `next.config.mjs` antes de publicar: una variable llamada `NEXTAUTH_SECRET` no debe terminar expuesta en un paquete cliente.
- No publiques instaladores Mac de prueba sin firma/notarización como distribución general.
- Prueba upgrades con **datos no productivos** y realiza copias de seguridad; Venty es un sistema de punto de venta.
- Evita reutilizar tags, sobrescribir Releases activas y desplegar una actualización que cierre la caja durante una operación.
- La compatibilidad del backend empaquetado debe validarse por arquitectura, particularmente si incluye dependencias nativas.
- En despliegues futuros, considera fijar el commit del backend para asegurar reproducibilidad; actualmente los workflows hacen checkout de `main` del backend.

---

**Mantenimiento:** actualiza este README cuando cambien los scripts de `package.json`, los runners, el backend nativo o el mecanismo de publicación. El contenido describe los archivos revisados y el `package.json` de versión `1.0.16` aportado para esta documentación; no certifica que todos los pipelines o instaladores estén validados en producción.
