import { Button, Column, EmptyData, IconSearch, PColor } from 'pkg-components'
import React, { useContext } from 'react'
import styles from './styles.module.css'
import { Context } from '../../../context/Context'

export const Sorry = () => {
  const { setShowComponentModal, handleClick } = useContext(Context)

  const handleOpenCreateProduct = () => {
    setShowComponentModal(3)
    handleClick(3)
  }

  return (
    <div className={styles['container']}>
      <Column style={{ display: 'flex' }}>
        <EmptyData height={300} width={300} />
      </Column>
      <Column style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }} >
        <Button
          borderRadius={'2px'}
          fontWeight={'400'}
          onClick={handleOpenCreateProduct}
          primary
          style={{ margin: '50px 0' }}
        >
            Agregar Productos
        </Button>
      </Column>
    </div>
  )
}
