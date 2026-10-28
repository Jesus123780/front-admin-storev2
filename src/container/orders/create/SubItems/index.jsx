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
  // The `sumExtraProducts` value provided by the sales hook is a hardcoded
  // sentinel (19999999) and does not reflect the user's current selection, so
  // we compute the real total of selected extras locally using the same price
  // logic as <Items />. Free items (price 0 with no quantity) are excluded.
  const computedSumExtra = (dataExtra || []).reduce((total, extra) => {
    const quantity = Number(extra?.quantity) || 0
    if (quantity === 0) {
      return total
    }
    const extraPrice = Number(extra?.extraPrice) || 0
    const newExtraPrice = extra?.newExtraPrice
    const hasNewPrice =
      newExtraPrice !== null &&
      newExtraPrice !== undefined &&
      newExtraPrice !== ''
    const linePrice = hasNewPrice
      ? Number(newExtraPrice) || 0
      : extraPrice * quantity
    return total + linePrice
  }, 0)
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
            {computedSumExtra > 0 && `${numberFormat(computedSumExtra)}`}
          </RippleButton>
        </Row>
      </Column>
    </AwesomeModal>
  )
}
