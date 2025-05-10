import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import os from 'os'
import { NextResponse } from 'next/server'

const stat = promisify(fs.stat)
const baseImagePath = path.join(os.homedir(), 'app_data')

// Manejo de GET
export async function GET(request, { params }) {
  try {
    const { filename } = params ?? {
      filename: ''
    }
    console.log("🚀 ~ GET ~ filename:", filename)

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const filePath = path.join(baseImagePath, filename)
    await stat(filePath)

    const ext = path.extname(filename).toLowerCase()
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml'
    }

    const contentType = mimeTypes[ext] || 'application/octet-stream'

    const fileBuffer = await fs.promises.readFile(filePath)

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
}
