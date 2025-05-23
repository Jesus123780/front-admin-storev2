import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()

    // Eliminar todas las cookies disponibles
    cookieStore.getAll().forEach(cookie => {
      cookieStore.delete(cookie.name)
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error processing request:', err)
    return new Response('Internal Server Error', { status: 500 })
  }
}
