# Integración de `pkg-components` y `npm-pkg-hook` en `front-admin-storev2`

Documento de referencia sobre cómo se integran los paquetes locales en el admin,
por qué aparece el error `Invalid hook call` y cómo resolverlo de forma estable.

---

## 1. Mapa de la integración

```
┌──────────────────────────────────────────────────────────────────────┐
│                       front-admin-storev2 (Next.js 15)                 │
│                                                                        │
│   React 19.0.0  ·  react-dom 19.0.0  ·  @apollo/client 3.13.5          │
│   @tanstack/react-query 5.104.2  ·  graphql 16.12.0                    │
│                                                                        │
│   ┌────────────────────────┐        ┌────────────────────────────┐    │
│   │  node_modules/          │        │  node_modules/             │    │
│   │  npm-pkg-hook  (symlink)│───────▶│  ../../pkg-hook  (local)   │    │
│   │                         │        │                            │    │
│   │  pkg-components(symlink)│───────▶│  ../../pkg-components(local)│   │
│   └────────────────────────┘        └────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘

                 Los paquetes están enlazados con `npm link`.
   (symlink = carpeta en node_modules que apunta al proyecto local real)
```

### Quién provee qué

| Paquete            | Rol                                   | Entrega al admin                          |
|--------------------|---------------------------------------|-------------------------------------------|
| `npm-pkg-hook`     | Hooks (useLoading, useLogout, etc.)   | React hooks + lógica Apollo / React Query |
| `pkg-components`   | UI (Button, Column, GoogleLogin, …)   | Componentes React                         |
| `front-admin-storev2` | App host (Next.js + Electron)      | Instancia **única** de React/Apollo/RQ    |

### Regla de oro

Estas librerías **DEBEN ser una sola instancia** en toda la app (son "singletons"):

- `react`, `react-dom`
- `@apollo/client`
- `@tanstack/react-query`, `@tanstack/query-core`
- `graphql`

El host (admin) es el dueño de esas instancias. Los paquetes enlazados las
declaran como **peerDependencies** y deben consumir las del host, NO traer
copias propias.

---

## 2. Por qué aparece `Invalid hook call`

```
Invalid hook call. Hooks can only be called inside of the body of a function component.
  3. You might have more than one copy of React in the same app
TypeError: Cannot read properties of null (reading 'useState')
```

Causa raíz: **hay más de una copia de React** en el árbol.

Con `npm link`, el resolver de módulos entra al symlink y, si el paquete
enlazado tiene su **propio** `node_modules/react`, los hooks de ese paquete
usan una instancia de React distinta a la del admin. React mantiene un estado
interno global ("dispatcher"); con dos copias, una de ellas ve ese estado en
`null` → `Cannot read properties of null (reading 'useState')`.

### Estado detectado en este proyecto

El paquete `pkg-hook` tenía copias duplicadas (reinstaladas por un `npm install`):

```
pkg-hook/node_modules/react              19.0.0   ← DUPLICADO
pkg-hook/node_modules/react-dom          19.0.0   ← DUPLICADO
pkg-hook/node_modules/@apollo/client     3.13.5   ← DUPLICADO
pkg-hook/node_modules/@tanstack/react-query 5.104.2 ← DUPLICADO
pkg-hook/node_modules/graphql            16.12.0  ← DUPLICADO
```

Esas copias son las que provocan "more than one copy of React".

```
         ADMIN                          PKG-HOOK (symlink)
   ┌──────────────┐                 ┌──────────────────────┐
   │ react 19 (A) │                 │ react 19 (B) ← copia  │
   └──────┬───────┘                 └───────────┬──────────┘
          │  monta providers                    │ hooks usan (B)
          ▼                                      ▼
   ApolloProvider / QueryClientProvider    useLoading(), etc.
          │                                      │
          └──────────────► MISMO ÁRBOL ◄─────────┘
                  dos dispatchers de React  →  ❌ Invalid hook call
```

---

## 3. El error secundario `stringify ... reading 'stack'`

```
TypeError: Cannot read properties of undefined (reading 'stack')
    at stringify (<anonymous>)
```

No es un error independiente: es el runtime de Next intentando **serializar**
el error real de arriba (el Invalid hook call) para enviarlo al cliente. El
objeto de error llega `undefined` y falla al leer `.stack`. En cuanto se
elimina la causa raíz (React duplicado), este error desaparece solo.

---

## 4. Solución (dos capas que se complementan)

### Capa 1 — Eliminar duplicados físicos en los paquetes enlazados

Quitar del `node_modules` de cada paquete enlazado las libs que deben ser
singletons. Como están declaradas como `peerDependencies`, no deben estar
instaladas físicamente cuando se usa `npm link`.

```bash
# en pkg-hook
rm -rf node_modules/react node_modules/react-dom \
       node_modules/@apollo/client \
       node_modules/@tanstack/react-query \
       node_modules/@tanstack/query-core \
       node_modules/graphql

# en pkg-components (verificar y limpiar si aparecen)
rm -rf node_modules/react node_modules/react-dom
```

### Capa 2 — Forzar resolución única con alias de webpack (red de seguridad)

En `next.config.mjs`, apuntar los singletons al `node_modules` del admin, para
que aunque reaparezcan copias (p. ej. tras un `npm install`), webpack siempre
use una sola instancia.

```js
const singletonModules = [
  '@apollo/client',
  'graphql',
  '@tanstack/react-query',
  '@tanstack/query-core',
]
```

> IMPORTANTE: **NO** incluir `react` ni `react-dom` en el alias.
> Aliasar `react` a un directorio rompe la resolución interna de React para
> Server Components (Next usa builds especiales de React en el servidor) y
> produce el error `stringify ... reading 'stack'` en SSR. Next ya deduplica
> React por sí mismo cuando no hay copias físicas duplicadas; por eso la Capa 1
> es la que resuelve React/react-dom, y el alias solo cubre Apollo/graphql/RQ.

---

## 5. Flujo correcto de trabajo con `npm link`

```bash
# 1. Registrar cada paquete local globalmente (una vez por paquete)
cd pkg-hook        && npm link
cd pkg-components  && npm link

# 2. Enlazarlos en el admin
cd front-admin-storev2
npm link npm-pkg-hook pkg-components     # (o: npm run link:pkgch)

# 3. Limpiar duplicados singleton en los paquetes (Capa 1)
#    y limpiar caché de Next
rm -rf .next
```

### Qué NO hacer

- ❌ `npm i pkg-components` → descarga la versión publicada y **rompe el link**;
  además la `2.3.11` publicada dependía de `pkg-components-types` (despublicado).
- ❌ Incluir `react`/`react-dom` en el alias de `next.config.mjs`.
- ❌ Correr `npm install` dentro de `pkg-hook`/`pkg-components` sin limpiar
  después los duplicados singleton (los reinstala y vuelve el error).

---

## 6. Checklist de diagnóstico rápido

```bash
# ¿Están enlazados como symlink?
readlink node_modules/npm-pkg-hook      # -> ../../pkg-hook
readlink node_modules/pkg-components    # -> ../../pkg-components

# ¿Hay React duplicado en los paquetes? (NO debe imprimir versiones)
ls ../pkg-hook/node_modules/react/package.json
ls ../pkg-components/node_modules/react/package.json

# ¿Cuántas copias de react ve el árbol del admin?
find node_modules -path "*/react/package.json" -not -path "*/node_modules/*/node_modules/*"
```

Si aparece `react` dentro de `pkg-hook/node_modules` o `pkg-components/node_modules`,
bórralo y reinicia el dev server (`rm -rf .next && npm run dev`).

---

## 7. Resumen

| Síntoma                                             | Causa                                        | Arreglo                                              |
|-----------------------------------------------------|----------------------------------------------|------------------------------------------------------|
| `Invalid hook call` / `null (reading 'useState')`   | Más de una copia de React (en `pkg-hook`)    | Borrar `react`/`react-dom` duplicados en el paquete  |
| `Detected multiple renderers`                       | Apollo / React Query duplicados              | Alias de singletons en `next.config.mjs`             |
| `stringify ... reading 'stack'` (500)               | `react`/`react-dom` en el alias de webpack   | Quitar `react`/`react-dom` del alias                 |
| `async Client Component`                            | Root `layout.tsx` con `'use client'`         | Layout como Server Component + shell client aparte   |
| `ENOVERSIONS pkg-components-types`                  | Versión publicada depende de un paquete 404  | Usar `npm link` local o publicar versión sana        |
