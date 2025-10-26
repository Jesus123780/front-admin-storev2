// app/api/port/route.ts
import { getPort } from 'get-port-please'

export async function GET() {
    const port = await getPort()
    return new Response(JSON.stringify({ port }), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}
