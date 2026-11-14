import {
    Column, Divider, getGlobalStyle, ImageQRCode,
    Row,
    Text
} from 'pkg-components'
import { FC } from 'react'

interface CodeDisplayProps {
    pCodeRef?: string | null
}

export const CodeDisplay: FC<CodeDisplayProps> = ({ pCodeRef }) => {
    return (
        <div style={{
            border: `1px solid ${getGlobalStyle('--color-neutral-gray-light')}`,
            padding: getGlobalStyle('--spacing-xl'),
            borderRadius: getGlobalStyle('--border-radius-md'),
        }}>
            <Row>
                <Column>
                    <Text font='light' size='sm' color='gray'>
                        Código de la orden
                    </Text>
                    <Divider
                        marginBottom={getGlobalStyle('--spacing-sm')}
                        marginTop={getGlobalStyle('--spacing-sm')}
                    />
                    <Column style={{
                        width: getGlobalStyle('--spacing-10xl'),
                        height: getGlobalStyle('--spacing-10xl')
                    }}>
                        <ImageQRCode
                            size={50}
                            value={pCodeRef ?? ''}
                        />
                    </Column>
                </Column>
            </Row>
        </div>
    )
}
