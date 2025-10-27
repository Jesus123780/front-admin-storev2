'use client'

import {
    AlertBox,
    Portal,
    Toast
} from 'pkg-components'
import { useContext } from 'react'

import { Context } from '@/context/Context'

export default function EmptyLayout({ children }: { children: React.ReactNode }) {
    const { messagesToast, error } = useContext(Context)
    return (
        <>
            <AlertBox err={error} />
            <Portal selector='portal'>
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    right: 0
                }} >
                    <Toast
                        autoDelete={true}
                        autoDeleteTime={7000}
                        position={'bottom-left'}
                        toastList={messagesToast}
                    />
                </div>
            </Portal>
            {children}
        </>
    )
}