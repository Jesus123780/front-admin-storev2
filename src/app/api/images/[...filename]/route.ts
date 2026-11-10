
import fs from 'fs'
import os from 'os'
import path from 'path'

// Mantener la misma ubicación donde el backend almacena las imágenes.
const baseImagePath = path.resolve(
  os.homedir(),
  process.env.PATH_EXTERNAL_OS || 'app_data'
)

const publicPlaceholderPath = path.join(
  process.cwd(),
  'public',
  'images',
  'placeholder-image.webp'
)

const mimeMap: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.jfif': 'image/jpeg',
  '.pjpeg': 'image/jpeg',
  '.pjp': 'image/jpeg',
  '.png': 'image/png',
  '.apng': 'image/apng',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.cur': 'image/x-icon',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
  '.heic': 'image/heic',
  '.heif': 'image/heif'
}

const allowedExtensions = new Set(Object.keys(mimeMap))

// MIME por defecto cuando la extensión es válida pero no está mapeada.
const defaultImageMime = 'application/octet-stream'

/**
 * Decodifica un valor de URL de forma segura. Si el valor no está
 * codificado o viene mal formado, devuelve el valor original en vez
 * de lanzar una excepción.
 */
const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

// Next.js 15+: params es una Promise.
// Se utiliza catch-all para capturar rutas con varios segmentos.
interface RouteContext {
  params: Promise<{
    filename: string[]
  }>
}

// Se necesita Node.js porque utilizamos fs.
export const runtime = 'nodejs'

export const GET = async (
  _req: Request,
  ctx: RouteContext
): Promise<Response> => {
  try {
    // Resolver params antes de acceder a filename.
    const { filename: rawFilename } = await ctx.params

    // Unir todos los segmentos recibidos por Next.js.
    const rawPath = Array.isArray(rawFilename)
      ? rawFilename.join('/')
      : String(rawFilename ?? '')

    // Next decodifica params, pero algunos nombres (con espacios o
    // caracteres especiales) pueden llegar aún codificados o parcialmente.
    // Decodificamos de forma segura para obtener el nombre real en disco.
    let filename = safeDecode(String(rawPath ?? '')).trim()

    // Normalizar rutas que llegan con barras adicionales.
    //
    // Ejemplos:
    // /images/producto.png -> producto.png
    // images/producto.png  -> producto.png
    // //images/producto.png -> producto.png
    filename = filename
      .replace(/^\/+/, '')
      .replace(/^images\/+/i, '')

    // Validar nombres vacíos o inválidos.
    if (
      !filename ||
      filename === 'null' ||
      filename === 'undefined'
    ) {
      return await servePlaceholder()
    }

    // Evitar path traversal.
    //
    // Importante: no rechazamos por la simple presencia de "..", porque
    // nombres válidos pueden contenerlo (ej: "archivo p. m..png").
    // Solo bloqueamos separadores de ruta o segmentos "." / ".." reales.
    const segments = filename.split(/[/\\]/)

    if (
      segments.length > 1 ||
      segments.some((segment) => segment === '.' || segment === '..')
    ) {
      return await servePlaceholder()
    }

    // Si solicitan directamente el placeholder, servir el archivo físico.
    // Esto evita cualquier posibilidad de un bucle de redirecciones.
    if (filename === 'placeholder-image.webp') {
      return await servePlaceholderImage()
    }

    // Validar extensión.
    const ext = path.extname(filename).toLowerCase()

    if (!allowedExtensions.has(ext)) {
      return await servePlaceholder()
    }

    // Construir y normalizar la ruta.
    const filePath = path.resolve(baseImagePath, filename)

    // Comprobar que el archivo permanece dentro del directorio permitido.
    const relativePath = path.relative(baseImagePath, filePath)

    if (
      !relativePath ||
      relativePath.startsWith('..') ||
      path.isAbsolute(relativePath)
    ) {
      return await servePlaceholder()
    }

    // Verificar que el archivo existe y es un archivo regular.
    const fileStats = await fs.promises.stat(filePath)

    if (!fileStats.isFile()) {
      return await servePlaceholder()
    }

    // Crear stream de lectura.
    const stream = fs.createReadStream(filePath)

    const headers = new Headers({
      'Content-Type': mimeMap[ext] || defaultImageMime,
      'Cache-Control': 'public, max-age=31536000, immutable'
    })

    return new Response(stream as unknown as BodyInit, {
      status: 200,
      headers
    })

  } catch {
    return await servePlaceholder()
  }
}

/**
 * Retorna directamente la imagen placeholder cuando el archivo solicitado
 * no existe, es inválido o sucede algún error.
 *
 * No realiza redirecciones: devuelve el contenido físico de la imagen.
 */
const servePlaceholder = async (): Promise<Response> => {
  return await servePlaceholderImage()
}

/**
 * Lee y retorna la imagen placeholder desde public/images/.
 */
const servePlaceholderImage = async (): Promise<Response> => {
  try {
    const fileStats = await fs.promises.stat(publicPlaceholderPath)

    if (!fileStats.isFile()) {
      return new Response(null, {
        status: 204
      })
    }

    const stream = fs.createReadStream(publicPlaceholderPath)

    const headers = new Headers({
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=3600'
    })

    return new Response(stream as unknown as BodyInit, {
      status: 200,
      headers
    })

  } catch {
    return new Response(null, {
      status: 204
    })
  }
}
