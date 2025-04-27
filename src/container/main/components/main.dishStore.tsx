'use client'

import React, { useCallback } from 'react'
import styles from '../styles.module.css'
import { Column, Divider, getGlobalStyle, Icon, Row, Text } from 'pkg-components'
import {
    useStore,
    useUser,
    useColorByLetters
} from 'npm-pkg-hook'
import { useRouter } from 'next/navigation'

export const DishStore = () => {
    const [dataStore] = useStore()
    const [dataUser] = useUser()
    const router = useRouter()

    const { email } = dataUser || {}

    const {
        storeName,
        idStore
    } = dataStore || {}
    const nameStore = storeName?.replace(/\s/g, '-').toLowerCase()
    const displayText = String(nameStore).substring(0, 2).toUpperCase()

    const handleCardClick = useCallback(() => {
        if (nameStore && idStore) {
            router.push(`/dashboard/${nameStore}/${idStore}`)
        } else {
            router.push('/dashboard')
        }
    }, [router, nameStore, idStore])
    const userEmail = email
    const {
        color,
        bgColor,
        borderColor
      } = useColorByLetters({
        value: nameStore
      })
    return (
        <div onClick={handleCardClick} className={styles.main__card}>
            <div className={styles.iconWrapper}>
                <Icon
                    color={getGlobalStyle('--color-icons-primary')}
                    height={50}
                    icon="IconArrowRight"
                    size={50}
                    width={50}
                />
            </div>
            <div className={styles['main__user-email']}>
                <div
                    className={styles.image_profile}
                    style={{
                        backgroundColor: bgColor,
                        fontSize: `${Math.round(60 / 100 * 37)}px`,
                        color: color,
                        boxShadow: '0px 3px 8px rgba(18, 18, 18, 0.04), 0px 1px 1px rgba(18, 18, 18, 0.02)',
                        borderColor: `${borderColor}50`,
                        borderWidth: 1,
                        borderStyle: 'solid',
                    }}
                >
                    {displayText}
                </div>
                <Column>
                    <Row>
                        <Text size="xl" weight="bold">
                            Bienvenido,{' '}
                            <Text size="md" weight="light">
                                {storeName || ''}
                            </Text>
                        </Text>
                    </Row>
                    <Divider marginTop={getGlobalStyle('--spacing-sm')} />
                    <Text color="gray">{userEmail ?? email}</Text>
                </Column>
            </div>

        </div>
    )
}
