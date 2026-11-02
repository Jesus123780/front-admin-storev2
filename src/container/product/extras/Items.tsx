import {
  EColor,
  Icon,
  numberFormat,
  QuantityButton,
  RippleButton
} from 'pkg-components'
import React from 'react'

import styles from './items.module.css'

interface ExtraItem {
  exPid?: string | number | null
  extraName?: string | null
  quantity?: number | string | null
  extraPrice?: number | string | null
}

interface RemoveExtraPayload<T extends ExtraItem> {
  Adicionales: T
  exPid?: T['exPid']
}

interface ChangeExtraQuantityPayload<T extends ExtraItem> {
  Adicionales: T
  index: number
}

interface ItemsProps<T extends ExtraItem = ExtraItem> {
  editing: boolean
  dataExtra?: T[]
  disabled?: boolean
  handleRemove?: (index: number, exPid?: T['exPid']) => void
  handleRemoveExtra?: (payload: RemoveExtraPayload<T>) => void
  handleIncrementExtra?: (payload: ChangeExtraQuantityPayload<T>) => void
  handleDecrementExtra?: (payload: ChangeExtraQuantityPayload<T>) => void
}

const Items = <T extends ExtraItem = ExtraItem>({
  editing,
  dataExtra = [],
  disabled = false,
  handleRemove = () => {},
  handleRemoveExtra = () => {},
  handleIncrementExtra = () => {},
  handleDecrementExtra = () => {}
}: ItemsProps<T>) => {
  return (
    <div className={styles.container}>
      {dataExtra.map((extra, index) => {
        const quantity = Number(extra?.quantity) || 0
        const extraPrice = Number(extra?.extraPrice) || 0

        // A complement is only free when its unit price is genuinely 0.
        // Quantity does not change whether the complement has a price.
        const isFree = extraPrice === 0

        // Show the line total when at least one unit is selected. Otherwise,
        // keep showing the unit price so a paid extra never appears as $0.
        const displayPrice =
          quantity > 0 ? extraPrice * quantity : extraPrice

        // Show the unit-price reference only when the line total differs
        // from the unit price.
        const showUnitPrice = !isFree && quantity > 1
        const isAdded = quantity > 0

        // In product-edit mode this removes the catalog entry. In the sale
        // flow it resets the selected quantity through handleRemoveExtra.
        const handleRemoveItem = () => {
          handleRemove(index, extra?.exPid)
        }

        const handleRemoveAdded = () => {
          handleRemoveExtra({ Adicionales: extra, exPid: extra?.exPid })
        }

        const handleDecrease = () => {
          handleDecrementExtra({
            Adicionales: extra,
            index
          })
        }

        const handleIncrease = () => {
          handleIncrementExtra({
            Adicionales: extra,
            index
          })
        }

        const itemClassName = [
          styles.item,
          editing && styles.itemEditing,
          isAdded && styles.itemAdded
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <article
            key={extra?.exPid ?? index}
            className={itemClassName}
          >
            <div className={styles.info}>
              <div className={styles.nameWrapper}>
                <h3 className={styles.title}>
                  {extra?.extraName || 'Sin nombre'}
                </h3>

                {showUnitPrice && (
                  <span
                    className={styles.unitPrice}
                    title='Precio unitario'
                  >
                    Precio unitario: {numberFormat(extraPrice)}
                  </span>
                )}
              </div>

              <div className={styles.priceWrapper}>
                <span
                  className={`${styles.price} ${
                    isFree ? styles.priceFree : ''
                  }`.trim()}
                >
                  {isFree ? 'Gratis' : numberFormat(displayPrice)}
                </span>

                {!isFree && showUnitPrice && (
                  <span className={styles.priceSuffix}>c/u</span>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              {editing ? (
                <RippleButton
                  aria-label={`Eliminar ${
                    extra?.extraName || 'complemento'
                  }`}
                  bgColor='transparent'
                  margin='0'
                  onClick={handleRemoveItem}
                  type='button'
                  widthButton='min-content'
                  className={styles.deleteButton}
                >
                  <Icon icon='IconDelete' color={EColor} size={22} />
                </RippleButton>
              ) : (
                <>
                  <QuantityButton
                    border='none'
                    disabled={disabled}
                    handleDecrement={handleDecrease}
                    handleIncrement={handleIncrease}
                    padding='5px'
                    quantity={quantity}
                    showNegativeButton={!quantity}
                    validationZero={false}
                    width='min-content'
                  />

                  {isAdded && (
                    <RippleButton
                      aria-label={`Quitar ${
                        extra?.extraName || 'complemento'
                      } del producto`}
                      bgColor='transparent'
                      disabled={disabled}
                      margin='0'
                      onClick={handleRemoveAdded}
                      type='button'
                      widthButton='min-content'
                      className={styles.deleteButton}
                    >
                      <Icon icon='IconDelete' color={EColor} size={20} />
                    </RippleButton>
                  )}
                </>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default Items
