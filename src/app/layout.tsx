"use client";

import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import ApolloClientProvider from "./providers/ApolloProvider";
import Context from "@/context/Context";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Context>
          <SessionProvider>
            <ApolloClientProvider>
              {children}
            </ApolloClientProvider>
          </SessionProvider>
        </Context>

      </body>
    </html>
  );
}
