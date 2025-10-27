import { OAuth2Client } from 'google-auth-library'
import { NextResponse } from 'next/server'

const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID_LOGIN_GOOGLE
const CLIENT_SECRET = process.env.NEXT_PUBLIC_SECRET_CLIENT_ID_LOGIN_GOOGLE
const REDIRECT_URI = 'http://localhost:5173/oauth/callback'

export async function GET(req: Request, res: Response) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const oAuth2Client = new OAuth2Client({
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      redirectUri: REDIRECT_URI,
    })
    const { tokens } = await oAuth2Client.getToken({
      code: String(code),
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI
    })
    oAuth2Client.setCredentials(tokens)
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token ?? '',
      audience: CLIENT_ID,
    })
    const payload = ticket.getPayload()

    return NextResponse.json(
      {
        access_token: tokens.access_token,
        id_token: tokens.id_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expiry_date,
        scope: tokens.scope,
        token_type: tokens.token_type,
        user_info: payload,
      },
      { status: 200 }
    )
  } catch (err) {
    const errorResponse = err.response?.data || {}
    const errorCode = errorResponse.error

    if (errorCode === 'invalid_grant') {
      return NextResponse.json(
        { error: 'El código de autorización expiró o ya fue usado.' },
        { status: 400 }
      )
    }

    console.error('OAuth Error:', errorResponse || err.message)
    return NextResponse.json(
      { error: 'Error al intercambiar el código por un token.' },
      { status: 500 }
    )
  }

}

// 