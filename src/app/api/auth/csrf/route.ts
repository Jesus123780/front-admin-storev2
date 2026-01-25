export async function POST(req: Request) {
    try {
        await req.json()
        return new Response(JSON.stringify({ success: true }))
    } catch (err) {
        if (err instanceof SyntaxError) {
            return new Response('Bad Request: Invalid JSON', { status: 400 })
        }
        return new Response('Internal Server Error', { status: 500 })
    }
}

export async function GET() {
    try {
        return new Response(JSON.stringify({ success: true }))
    } catch (err) {
        if (err instanceof SyntaxError) {
            return new Response('Bad Request: Invalid JSON', { status: 400 })
        }
        return new Response('Internal Server Error', { status: 500 })
    }
}