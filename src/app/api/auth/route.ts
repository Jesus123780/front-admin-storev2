import { NextResponse } from "next/server";

export async function GET(req: Request, res: Response) {
  const code = req.url.split("?code=")[1]
  console.log("🚀 ~ GET ~ code:", code)
  const params = new URLSearchParams({
    code,
    client_id: process.env.CLIENT_ID_LOGIN_GOOGLE!,
    client_secret: process.env.SECRET_CLIENT_ID_LOGIN_GOOGLE!,
    redirect_uri: "http://localhost:3000/api/auth", // debe coincidir exactamente con el registrado en Google
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })
  return NextResponse.json(req);
}