"use client"

import { Column } from 'pkg-components'
import React, { useRef, useState } from 'react'
import Script from 'next/script'
import { Login } from '@/container/login/index'

export default function Entrar() {
    const refFloatBntLogin = useRef<HTMLDivElement>(null)
    const [show] = useState(false)
    const [googleLoaded, setGoogleLoaded] = useState(false)

    const handleGoogleLogin = async () => {
        try {
            if (typeof window !== 'undefined' && window.electron) {
                console.log('Google login button clicked')
                const response = await window.electron.ipcRenderer.invoke('start-google-auth')
                console.log('Google auth response:', response)
            }
        } catch (error) {
            console.error('Error during Google login:', error)
        }
    }

    return (
        <Column as='main'>
            <Script
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onLoad={() => setGoogleLoaded(true)}
                onError={(e) => console.error('Script failed to load', e)}
            />
            {show && <button onClick={handleGoogleLogin}>
                Login with Google (Electron)
            </button>}
            <Login refFloatBntLogin={refFloatBntLogin} googleLoaded={googleLoaded} />
        </Column>
    )
}
