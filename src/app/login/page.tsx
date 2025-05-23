"use client"

import React, { useState } from 'react'
import { Column } from 'pkg-components'
import Script from 'next/script'
import { Login } from '@/container/login/index'

export default function Entrar() {
    const [googleLoaded, setGoogleLoaded] = useState(false)

    return (
        <Column as='main'>
            <>
                <Script
                    src="https://accounts.google.com/gsi/client"
                    strategy="afterInteractive"
                    onLoad={() => setGoogleLoaded(true)}
                    onError={(e) => console.error('Script failed to load', e)}
                />
                <Login
                    googleLoaded={googleLoaded}
                />
            </>
        </Column>
    )
}
