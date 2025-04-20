'use client'

import PropTypes from 'prop-types'
import { 
  useStore, 
  useUser, 
  useLocalBackendIp, 
  useColorByLetters
} from 'npm-pkg-hook'
import { 
  Column, 
  Divider, 
  getGlobalStyle, 
  Icon, 
  ImageQRCode, 
  Row, 
  Text
} from 'pkg-components'
import styles from './styles.module.css'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { ChatStatistic } from '../ChatStatistic'

interface User {
  email?: string;
}

export const Main = ({ user = {} as User }) => {
  const [dataUser] = useUser()
  const { ip } = useLocalBackendIp()
  const router = useRouter()
  const { email } = dataUser || {}
  console.log("🚀 ~ Main ~ email:", email)
  const [dataStore] = useStore()
  const { storeName, idStore } = dataStore || {}
  const nameStore = storeName?.replace(/\s/g, '-').toLowerCase()
  const userEmail = email || user?.email
  const { 
    color,
    bgColor,
    borderColor
  } = useColorByLetters({
    value: nameStore
  })

  const displayText = String(nameStore).substring(0, 2).toUpperCase()

  const handleCardClick = useCallback(() => {
    if (nameStore && idStore) {
      router.push(`/dashboard/${nameStore}/${idStore}`)
    } else {
      router.push('/dashboard')
    }
  }, [router, nameStore, idStore])

  return (
    <Column>
      <Row
        style={{
          flexWrap: 'wrap'
        }}
      >
        <Row>
          <Row className={styles.main}>
            <div className={styles.main__card} onClick={handleCardClick}>
              <div className={styles.iconWrapper}>
                <Icon
                  color={getGlobalStyle('--color-icons-primary')}
                  height={50}
                  icon='IconArrowRight'
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
                    borderColor:  `${borderColor}50`,
                    borderWidth: 1,
                    borderStyle: 'solid'
                  }}  
                >
                  {displayText}
                </div>
                <Column>
                  <Row>
                    <Text
                      size='xl'
                      weight='bold'
                    >
                    Bienvenido, {' '}
                      <Text size='md' weight='light'>
                        {storeName || ''}
                      </Text>
                    </Text>
                  </Row>
                  <Divider marginTop={getGlobalStyle('--spacing-sm')} />
                  <Text 
                    color='gray'
                  > 
                    {userEmail ?? email}
                  </Text>
                </Column>
              </div>
            </div>
          </Row>
          <ImageQRCode value={ip} />
        </Row>
      </Row>
      <ChatStatistic />
    </Column>
  )
}

Main.propTypes = {
  user: PropTypes.object
}
