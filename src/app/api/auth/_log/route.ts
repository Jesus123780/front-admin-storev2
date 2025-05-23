export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Aquí puedes manejar el mensaje recibido
    console.log('Mensaje recibido:', body)

    return new Response(JSON.stringify({ success: true }))
  } catch (err) {
    console.error('Error processing request:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}