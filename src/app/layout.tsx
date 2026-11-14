
'use client'

import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { ROUTES } from 'pkg-components'
import { useEffect, useState } from 'react'

import { ElectronUpdateModal } from '@/components/ElectronUpdateModal'
import { VentyLoadingProvider } from '@/components/Loader/Context/Context'
import { Loader } from '@/components/Loader/index'
import { MemoLayout } from '@/container/Layout'
import Context from '@/context/Context'

import Auth from '../../apollo/Auth'
import ApolloClientProvider from './providers/ApolloProvider'
import QueryProvider from './providers/QueryProvider'

const ROUTES_WITHOUT_LAYOUT = new Set([
  ROUTES.index,
  ROUTES.login,
  ROUTES.merchant,
  ROUTES.register,
  ROUTES['forgot-password'],
  ROUTES['verify-email'],
  ROUTES['reset-password'],
  '/verify-email'
])

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const [isMounted, setIsMounted] = useState(false)
  const [bootFinished, setBootFinished] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Da tiempo a que aparezca el contenido
    // antes de retirar la pantalla inicial.
    const timer = window.setTimeout(() => {
      setBootFinished(true)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [])

  return (
    <html lang='es'>
      <Script
        id='google-tag-manager'
        strategy='afterInteractive'
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){
              w[l]=w[l]||[];
              w[l].push({
                'gtm.start':new Date().getTime(),
                event:'gtm.js'
              });
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),
              dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;
              j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-59SFH7N');
          `
        }}
      />

      <body>
        <VentyLoadingProvider>
          <ElectronUpdateModal />

          <QueryProvider>
            <div id='portal' />

            {isMounted && (
              <Context>
                <ApolloClientProvider>
                  <Auth>
                    {ROUTES_WITHOUT_LAYOUT.has(pathname)
                      ? children
                      : (
                        <MemoLayout>
                          {children}
                        </MemoLayout>
                      )
                    }
                  </Auth>
                </ApolloClientProvider>
              </Context>
            )}
          </QueryProvider>
        </VentyLoadingProvider>

        {/* Pantalla inicial durante hidratación */}
        <Loader
          label='Iniciando'
          exiting={bootFinished}
        />
      </body>
    </html>
  )
}
