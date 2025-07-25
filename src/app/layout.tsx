'use client'

import ApolloClientProvider from './providers/ApolloProvider'
import Context from '@/context/Context'
import Script from 'next/script'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { MemoLayout } from '@/container/Layout'
import StyledComponentsRegistry from '@/utils/registry'
import { BarcodeScanner, ProgressBar, ROUTES } from 'pkg-components'

const ROUTES_WITHOUT_LAYOUT = new Set([
  '/',
  ROUTES.login,
  ROUTES.merchant,
  ROUTES.register,
  ROUTES['forgot-password'],
  ROUTES['verify-email'],
  ROUTES['reset-password'],
  '/verify-email'
])

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<number>(0)
  const [hidden, setHidden] = useState(true)
  const pathname = usePathname()

  useEffect(() => {
    setProgress(10)
    setHidden(false)

    const interval = setInterval(() => {
      setProgress(prev => (prev < 90 ? prev + 20 : prev))
    }, 200)

    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)

      setTimeout(() => {
        setHidden(true)
      }, 400)
      setTimeout(() => {
        setProgress(0)
      }, 500)
    }, 1000)

    return () => clearInterval(interval)
  }, [pathname])

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])


  return (
    <html lang='es'>
      <div id='portal' />
      <Script
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer', 'GTM-59SFH7N');
          `
        }}
        id='afterInteractive'
        strategy='afterInteractive'
      />

      <body>
        <ProgressBar progress={progress} hidden={hidden} />
        {isMounted && <Context>
          {/* <BarcodeScanner /> */}
          <StyledComponentsRegistry>
            <ApolloClientProvider>
              {ROUTES_WITHOUT_LAYOUT.has(pathname)
                ? children
                : <MemoLayout>
                  {children}
                </MemoLayout>
              }
            </ApolloClientProvider>
          </StyledComponentsRegistry>
        </Context>
        }
      </body>
    </html>
  )
}
