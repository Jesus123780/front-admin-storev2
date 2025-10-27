import path from 'node:path'
import fs from 'node:fs'
import { promisify } from 'node:util'
import os from 'node:os'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const stat = promisify(fs.stat)
const unlink = promisify(fs.unlink)
const baseFilePath = path.join(os.homedir(), 'app_data')

/**
 * Handle GET requests for file downloads and delete the file after serving.
 * @param {Request} request - The incoming request.
 * @param {{ params: { filename: string } }} context - Params from route.
 * @returns {Promise<Response>}
 */
interface RouteParams {
  filename: string
}

interface RouteContext {
  params: RouteParams
}

type MimeTypesMap = Record<string, string>

export async function GET(_: Request, context: RouteContext): Promise<Response> {
  const cookie = await cookies()
  const session = cookie.get('session')
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Missing session token' }, { status: 401 })
  }
  try {
    const params = await context.params
    const filename = params?.filename
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const filePath = path.join(baseFilePath, filename)

    // Validate file existence
    await stat(filePath)

    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: MimeTypesMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.zip': 'application/zip'
    }

    const contentType = mimeTypes[ext] || 'application/octet-stream'

    const fileBuffer = await fs.promises.readFile(filePath)

    // Schedule file deletion (don't await to avoid blocking download)
    unlink(filePath).catch(err => {
      console.warn(`Failed to delete file ${filename}:`, err)
    })
    // @ts-ignore
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({ error: 'File not found or cannot be accessed' }, { status: 404 })
  }
}
