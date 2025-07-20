'use client'

import PropTypes from 'prop-types'
import React from 'react'
import {
  AwesomeModal,
  RippleButton,
  Skeleton,
  QuantityButton,
  LoaderSubItem,
  getGlobalStyle,
  numberFormat,
  Row
} from 'pkg-components'
import { 
  Container, 
  Content
} from './styled'
import { ExtrasProductsItems } from '@/container/product/extras/ExtrasProductsItems'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'

export const SubItems = ({
  dataExtra = [],
  dataOptional = [],
  disabled = false,
  modalItem,
  loading = false,
  product = {
    pId: '',
    pName: '',
    ProPrice: '',
    ProQuantity: 0
  },
  handleDecrement = () => {
    return
  },
  handleIncrement = () => {
    return
  },
  sumExtraProducts,
  setModalItem = (boolean) => {
    return boolean
  },
  handleAddOptional = () => {
    return
  },
  handleDecrementExtra = () => {
    return
  },
  handleIncrementExtra = () => {
    return
  },
  handleUpdateAllExtra = () => {
    return
  }
}) => {
  const { pId, pName, ProPrice, ProQuantity } = product ?? {
    pId: '',
    pName: '',
    ProPrice: '',
    ProQuantity: ''
  }
  const showQuantity = false
  return (
    <AwesomeModal
      borderRadius='4px'
      btnCancel={true}
      btnConfirm={false}
      customHeight='60vh'
      footer={false}
      header={true}
      height='60vh'
      onCancel={() => {
        return false
      }}
      onHide={() => {
        return setModalItem(!modalItem)
      }}
      padding={0}
      question={false}
      show={modalItem}
      size={MODAL_SIZES.medium}
      sizeIconClose='30px'
      title='Listado de sub productos'
      
      zIndex={getGlobalStyle('--z-index-modal')}
    >
      <Content>
        <div className='header'>
          {pName}
        </div>
        <Container>
          {loading ? (
            <LoaderSubItem />
          ) : (
            <ExtrasProductsItems
              dataExtra={dataExtra || []}
              dataOptional={dataOptional || []}
              disabled={disabled}
              editing={false}
              handleAddOptional={handleAddOptional}
              handleDecrementExtra={handleDecrementExtra}
              handleIncrementExtra={handleIncrementExtra}
              modal={false}
              pId={pId}
              setModal={() => {
                return
              }}
            />
          )}
        </Container>

        <Row>
          {loading ? (
            <Skeleton numberObject={1} style={{ padding: 0, margin: 0 }} />
          ) : (
            (showQuantity && 
            <QuantityButton
              handleDecrement={handleDecrement}
              handleIncrement={handleIncrement}
              label={numberFormat(ProPrice)}
              quantity={ProQuantity}
              showNegativeButton={
                !ProQuantity || ProQuantity === 0 || ProQuantity === null
              }
              validationZero={false}
            />
            )
          )}
          <RippleButton
            disabled={disabled}
            onClick={() => {
              handleUpdateAllExtra()
              setModalItem(!modalItem)
            }}
          >
              Agregar
            {!!sumExtraProducts && `${numberFormat(sumExtraProducts || '')}`}
          </RippleButton>
        </Row>
      </Content>
    </AwesomeModal>
  )
}

SubItems.propTypes = {
  dataExtra: PropTypes.array,
  dataOptional: PropTypes.array,
  disabled: PropTypes.bool,
  handleAddOptional: PropTypes.func,
  handleDecrement: PropTypes.any,
  handleDecrementExtra: PropTypes.func,
  handleIncrement: PropTypes.any,
  handleIncrementExtra: PropTypes.func,
  handleUpdateAllExtra: PropTypes.func,
  loading: PropTypes.bool,
  modalItem: PropTypes.any,
  product: PropTypes.object,
  setModalItem: PropTypes.func,
  sumExtraProducts: PropTypes.string
}
