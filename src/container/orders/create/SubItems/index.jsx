'use client'

import {
  AwesomeModal,
  Column,
  LoaderSubItem,
  numberFormat,
  QuantityButton,
  RippleButton,
  Row,
  Skeleton
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'

import { ExtrasProductsItems } from '@/container/product/extras/ExtrasProductsItems'

import { useModalLayer } from '../modalLayers'
import styles from './style.module.css'

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
  const zIndex = useModalLayer(Boolean(modalItem))
  return (
    <AwesomeModal
      borderRadius='4px'
      btnCancel={true}
      btnConfirm={false}
      customHeight='60vh'
      footer={false}
      header={true}
      height='60vh'
      zIndex={zIndex}
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
    >
      <Column className={styles.container}>
        <Column className={styles.header}>
          {pName}
        </Column>
        <Column>
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
        </Column>

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
            {!!sumExtraProducts && `${numberFormat(sumExtraProducts ??  0)}`}
          </RippleButton>
        </Row>
      </Column>
    </AwesomeModal>
  )
}
