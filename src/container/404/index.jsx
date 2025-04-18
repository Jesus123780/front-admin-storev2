import React from 'react'
import PropTypes from 'prop-types'
import {
  Column,
  Text,
  Portal,
  RippleButton,
  Row,
  getGlobalStyle,
  Divider,
  Image
} from 'pkg-components'
import { useRouter } from 'next/navigation'
import { BGColor, SECColor } from 'public/colors'
import styles from './styles.module.css'

const NotFount = ({
  error = '¡Algo salió mal! Parece que la página que buscas ya no está disponible',
  errorType = '404',
  labelButton = 'Regresar al inicio',
  redirect = '/dashboard'
}) => {
  const router = useRouter()
  return (
    <Portal selector='portal'>
      <Row>
        <Column
          className={styles.container_404__content}
          style={{
            width: '50%',
            height: '100vh'
          }}
        >
          <Text
            color='default'
            size='5xl'
            weight='bold'
          >
            Ups...
          </Text>
          <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
          <Text
            color={SECColor}
            size='2xl'

          >
            {error}
          </Text>
          <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
          <RippleButton
            color={BGColor}
            onClick={() => {
              return router.push(redirect)
            }}
            radius={getGlobalStyle('--border-radius-2xs')}
            widthButton='14rem'
          >
            {labelButton}
          </RippleButton>
          <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
          <Column>
            <Text size='6xl'>
              {errorType}
            </Text>
          </Column>
        </Column>
        <Column
          style={{
            width: '50%',
            height: '100vh'
          }}
        >
          <div className={styles.container_404__image}>
            <Image
              className={styles.content_404__image}
              height='100%'
              src='/Images/fresh-waffle-cone-ice-cream.png'
              width='100%'
            />
          </div>
        </Column>
      </Row>
    </Portal>
  )
}

NotFount.propTypes = {
  error: PropTypes.string,
  errorType: PropTypes.string,
  labelButton: PropTypes.string,
  redirect: PropTypes.string
}

export default NotFount
