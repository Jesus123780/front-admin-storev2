import NextAuth from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import AppleProvider from "next-auth/providers/apple";
import FacebookProvider from "next-auth/providers/facebook";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import InstagramProvider from "next-auth/providers/instagram";

const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.CLIENT_ID_LOGIN_GOOGLE!,
      clientSecret: process.env.SECRET_CLIENT_ID_LOGIN_GOOGLE!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        },
      },
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
    }),
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID!,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
    }),
  ],
  pages: {
    error: "/404",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async signIn({ user, account, profile }) {
      const { id, name, email } = user || {};
      const { family_name } = profile || {};

      const body = {
        name,
        username: name,
        lastName: family_name || name,
        email,
        password: id,
        locationFormat: [],
        useragent: "",
        deviceid: "",
      };

      try {
        const requestLogin = await fetch(`${process.env.URL_BACK_SERVER}/api/auth`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          credentials: "include",
        });

        if (!requestLogin.ok) {
          throw new Error("Error en la solicitud");
        }

        const responseData = await requestLogin.json();
        const cookie = requestLogin.headers.get("set-cookie");
        const encodedSession = cookie ? cookie.split("=")[1]?.split(";")[0] : null;

        if (account) {
          account.id = user.id;
          account[process.env.SESSION_NAME!] = encodedSession;
          account.user = responseData;
        }
        return true;
      } catch (error) {
        return false;
      }
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = account.id;
        token[process.env.SESSION_NAME!] = account[process.env.SESSION_NAME!];
        token.user = account.user;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.id = token.id;
      session[process.env.SESSION_NAME!] = token[process.env.SESSION_NAME!];
      session.session = token.user;
      return session;
    },
  },
  session: {
    maxAge: 24 * 60 * 60,
  },
  debug: false,
};

// **Definición de los métodos HTTP (GET y POST) para NextAuth**
export const GET = async (req, res) => {
  return NextAuth(req, res, authOptions);
};

export const POST = async (req, res) => {
  return NextAuth(req, res, authOptions);
};
