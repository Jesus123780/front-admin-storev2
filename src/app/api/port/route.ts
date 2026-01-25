// app/api/port/route.ts
import { getPort } from 'get-port-please'
import { NextResponse } from 'next/server'

export async function GET() {
    const port = await getPort()
    return NextResponse.json({ port })
}
