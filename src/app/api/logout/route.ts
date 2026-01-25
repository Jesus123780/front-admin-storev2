import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
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
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
