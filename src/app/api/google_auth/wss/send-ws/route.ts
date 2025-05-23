// app/api/send-ws/route.ts
import { getWSServer } from '../lib/ws-server'



export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { message } = body

    if (!message) {
      return new Response('Missing message', { status: 400 })
    }

    const { wss } = await getWSServer();

    // Enviar mensaje a todos los clientes conectados
    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    })
    // close the server
    wss.close()

    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    console.error('Error sending WS message:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
