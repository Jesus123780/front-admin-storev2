import React from 'react'
import PropTypes from 'prop-types'
import { Text } from 'pkg-components'
import { Steps } from '../styles'
import styles from './HeaderSteps.module.css'

export const HeaderSteps = ({ active }) => {
  const titleHeaders = ['DETALLES', 'ADICIONALES', 'COMPLEMENTOS', 'DISPONIBILIDAD']
  const tabWidth = 100 / titleHeaders.length

  return (
    <Steps>
      {titleHeaders.map((title) => {
        return (
          <div
            className={styles.tabs}
            key={title}
          >
            <Text
              align='center'
              as='h2'
              className={styles.text}
              fontFamily='PFont-Light'
              fontSize='.9rem'
              fontWeight='500'
              style={{ userSelect: 'none' }}
            >
              {title}
            </Text>
          </div>
        )
      })}
      <span
        className={styles.slider}
        style={{
          left: `${active * tabWidth}%`,
          width: `${tabWidth}%`
        }}
      ></span>
    </Steps>
  )
}

HeaderSteps.propTypes = {
  active: PropTypes.number
}
