'use client'

import React, { useState } from 'react'
import { StyleSheetManager } from 'styled-components'

export function StyledComponentsRegistry({ children }: { children: React.ReactNode }) {
    const [styledComponentsStyleSheet] = useState(() => typeof window === 'undefined' ? require('styled-components').ServerStyleSheet : null)

    if (styledComponentsStyleSheet === null) {
        return <>{children}</>
    }
    return (
        <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
            {children}
        </StyleSheetManager>
    )
}