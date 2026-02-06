'use client'

import {
    AlertBox,
    Portal,
    Toast
} from 'pkg-components'
import { AlertContentProps } from 'pkg-components/stories/molecules/AlertBox/types'
import { useContext } from 'react'

import { Context } from '@/context/Context'

export default function EmptyLayout({ children }: { children: React.ReactNode }) {
    const { messagesToast, error, deleteToast } = useContext(Context)
    return (
        <>
            <AlertBox err={error as AlertContentProps} />
            <Portal selector='portal'>
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    right: 0
                }} >
                    <Toast
                        autoDelete={true}
                        autoDeleteTime={3000}
                        deleteToast={deleteToast}
                        position={'bottom-left'}
                        toastList={messagesToast}
                    />
                </div>
            </Portal>
            {children}
        </>
    )
}