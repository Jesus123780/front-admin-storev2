import { getServerPortWss } from './lib/ws-server';

let wsUrl: string | null = null;

export async function GET() {
     const PORT = await getServerPortWss()
     const url = `ws://localhost:${PORT}`
    return Response.json({ url });
}
