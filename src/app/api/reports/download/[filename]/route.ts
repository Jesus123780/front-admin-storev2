import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const stat = promisify(fs.stat)

/**
 * Base directory where the backend writes generated report files
 * (mirrors `PATH_EXTERNAL_OS`, default `app_data` under the user home).
 */
const baseFilePath = path.join(os.homedir(), 'app_data')

interface RouteParams {
  filename: string
}

interface RouteContext {
  params: Promise<RouteParams> | RouteParams
}

type MimeTypesMap = Record<string, string>

const MIME_TYPES: MimeTypesMap = {
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf'
}

/**
 * Serves a generated report file for download.
 *
 * Unlike the generic `/api/files/[filename]` proxy, this route is dedicated to
 * report exports and does NOT delete the file after serving, so the user can
 * re-download a report from the history while it remains valid. File retention
 * and cleanup are owned by the backend worker (per-job `expiresAt`).
 *
 * Security:
 * - Requires a `session` cookie.
 * - Resolves the file strictly inside the storage directory (rejects path
 *   traversal); a manipulated `..`/absolute name cannot escape the sandbox.
 *
 * @param _ - The incoming request (unused).
 * @param context - Route params carrying the file name.
 * @returns The file stream with the correct content type, or an error response.
 */
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

    // Reject any path traversal: the resolved path must stay inside baseFilePath.
    const resolved = path.resolve(baseFilePath, filename)
    if (path.dirname(resolved) !== path.resolve(baseFilePath)) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
    }

    await stat(resolved)

    const ext = path.extname(filename).toLowerCase()
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'
    const fileBuffer = await fs.promises.readFile(resolved)

    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch {
    // File missing or unreadable: respond 404 without leaking internal details.
    return NextResponse.json({ error: 'File not found or cannot be accessed' }, { status: 404 })
  }
}
