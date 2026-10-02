'use client'

import {
    AlertBox,
    Portal,
    Toast,
    ToastPosition
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
                        toastList={messagesToast.map((toast) => ({
                            id: toast.id,
                            title: String(toast.title ?? ''),
                            description: String(toast.description ?? ''),
                            backgroundColor: toast.backgroundColor,
                            position: toast.position,
                            createdAt: toast.createdAt,
                            sequence: toast.sequence
                        }))}
                        autoDelete
                        autoDeleteTime={5000}
                        position={ToastPosition['bottom-left']}
                        deleteToast={deleteToast}
                    />
                </div>
            </Portal>
            {children}
        </>
    )
}