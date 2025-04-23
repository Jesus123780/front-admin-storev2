'use client'

import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { 
  Button, 
  getGlobalStyle, 
  Icon
} from 'pkg-components'
import { Context } from '../../../context/Context'
import styles from './styles.module.css'

export const ButtonsAction = ({ handle = (number, name, bool) => { return { number, name, bool } } }) => {
  const { setShowComponentModal } = useContext(Context)

  const buttonsData = [
    {
      label: 'Subir productos',
      icon: 'IconTicket',
      onClick: () => { return handle(3, 'product', true) }
    },
    {
      label: 'Categorías',
      icon: 'IconBox',
      onClick: () => { return handle(2, 'categories', true) }
    },
    {

      label: 'Organizar agenda',
      icon: 'time',
      onClick: () => { return setShowComponentModal(1) }
    },
    {

      label: 'Cargar Excel de Productos',
      icon: 'IconExcel',
      onClick: () => { return handle(4, 'categories', true) },
      style: {
        minWidth: '280px'
      }
    },
    {

      label: 'Crear mesas',
      icon: 'IconBox',
      onClick: () => { return handle(5, 'categories', true) },
      style: {
        minWidth: '200px'
      }
    }
  ]

  return (
    <div className={styles.Wrapper_options}>
      {buttonsData.map((button, index) => {
        return (
          <Button
            fontSize={getGlobalStyle('--font-size-xs')}
            key={index}
            onClick={button.onClick}
            style={{
              margin: getGlobalStyle('--spacing-xs'),
              color: getGlobalStyle('--color-neutral-gray-dark'),
              border: `1px solid ${getGlobalStyle('--color-neutral-gray-dark')}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              maxWidth: '300px',
              minWidth: '200px',
              padding: getGlobalStyle('--spacing-lg'),
              ...button.style
            }}
          >
            {button.label}
            <Icon
              height={20}
              icon={button.icon}
              size={20}
              style={{ marginLeft: getGlobalStyle('--spacing-md') }}
              width={20}
            />
          </Button>
        )
      })}
    </div>
  )
}


ButtonsAction.propTypes = {
  handle: PropTypes.func
}
