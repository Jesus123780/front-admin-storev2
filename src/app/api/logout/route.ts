import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const ARRAY_COOKIES = ['merchant', String(process.env.NEXT_PUBLIC_SESSION_NAME)];
    const cookieStore = await cookies()

    for (const cookieName of ARRAY_COOKIES) {
      const cookieValue = cookieStore.get(cookieName);
      if (cookieValue) {
        cookieStore.delete(cookieName);
      }
    }

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error("Error in GET:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
