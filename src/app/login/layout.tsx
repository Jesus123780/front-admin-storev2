'use client'

import { Context } from '@/context/Context'
import {
    AlertBox,
    Portal,
    Toast
} from 'pkg-components'
import { useContext } from 'react'

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
                        position={'bottom-right'}
                        toastList={messagesToast}
                    />
                </div>
            </Portal>
            {children}
        </>
    )
}