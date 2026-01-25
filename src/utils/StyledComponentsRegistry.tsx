'use client'

import React, { useState } from 'react'
import { ServerStyleSheet, StyleSheetManager } from 'styled-components'

export function StyledComponentsRegistry({ children }: { children: React.ReactNode }) {
    const [styledComponentsStyleSheet] = useState(() => typeof window === 'undefined' ? new ServerStyleSheet() : null)

    if (styledComponentsStyleSheet === null) {
        return <>{children}</>
    }
    return (
        <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
            {children}
        </StyleSheetManager>
    )
}