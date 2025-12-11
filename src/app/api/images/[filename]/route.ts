import fs from 'fs'
import os from 'os'
import path from 'path'

const baseImagePath = path.join(os.homedir(), 'app_data') // ajusta si hace falta
const publicPlaceholderPath = path.join(process.cwd(), 'public', 'images', 'placeholder-image.webp')

/**
 * Serve an image from disk or the placeholder when anything fails.
 * @param {Request} _req Incoming request (unused).
 * @param {{ params?: Record<string,string> }} ctx Route context containing params.
 * @returns {Promise<Response>} Response with image bytes and proper headers.
 */
export const GET = async (_req: Request, ctx: { params?: Record<string, string> }) => {
  try {
    const rawFilename = ctx?.params?.filename ?? ''
    const filename = decodeURIComponent(String(rawFilename || '')).trim()

    // quick sanitization: empty/null/"undefined"/"null" => fallback
    if (!filename || filename === 'null' || filename === 'undefined') {
      return servePlaceholder()
    }

    // only allow safe filenames (no traversal)
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return servePlaceholder()
    }

    const ext = path.extname(filename).toLowerCase()
    const allowedExts = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'])
    if (!allowedExts.has(ext)) { return servePlaceholder() }

    const filePath = path.join(baseImagePath, filename)
    const normalized = path.normalize(filePath)

    // ensure the resolved path is inside baseImagePath (prevent path traversal)
    if (!normalized.startsWith(path.normalize(baseImagePath + path.sep))) {
      return servePlaceholder()
    }

    // stat -> if not exists, fallback
    await fs.promises.stat(normalized)

    // Stream the file (efficient for large images)
    const stream = fs.createReadStream(normalized)

    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    }

    const headers = new Headers({
      'Content-Type': mimeMap[ext] || 'application/octet-stream',
      // Cache aggressively for real images
      'Cache-Control': 'public, max-age=31536000, immutable'
    })

    return new Response(stream as unknown as BodyInit, { status: 200, headers })
  } catch (err) {
    // any failure => return placeholder image (no JSON errors)
    if (err instanceof Error) {
      return servePlaceholder()
    }
    return servePlaceholder()
  }
}

/**
 * Return the placeholder image as a Response.
 * If placeholder file missing, returns a 204 empty response to avoid JSON.
 * @returns {Promise<Response>}
 */
const servePlaceholder = async (): Promise<Response | BodyInit> => {
  try {
    await fs.promises.stat(publicPlaceholderPath)
    const stream = fs.createReadStream(publicPlaceholderPath)
    const headers = new Headers({
      'Content-Type': 'image/webp',
      // shorter cache for placeholder so you can replace it in deployment if needed
      'Cache-Control': 'public, max-age=3600'
    })
    return new Response(stream as unknown as BodyInit, { status: 200, headers })
  } catch (e) {
    // last-resort: nothing to serve, return empty 204 (no JSON)
    if (e instanceof Error) {
      return new Response(null, { status: 204 })
    }
    return new Response(null, { status: 204 })
  }
}
