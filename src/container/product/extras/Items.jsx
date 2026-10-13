import clsx from 'clsx'
import {
  EColor,
  Icon,
  numberFormat,
  QuantityButton,
  RippleButton
} from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'

import styles from './styles.module.css'

const Items = ({
  editing,
  dataExtra = [],
  disabled = false,
  handleRemove = () => {},
  handleIncrementExtra = () => {},
  handleDecrementExtra = () => {}
}) => {
  return (
    <div className={styles.container}>
      {dataExtra.map((extra, index) => {
        const quantity = Number(extra?.quantity) || 0
        const extraPrice = Number(extra?.extraPrice) || 0
        const newExtraPrice = extra?.newExtraPrice

        const contentPrice =
          extraPrice === 0 && quantity === 0

        const hasNewPrice =
          newExtraPrice !== null &&
          newExtraPrice !== undefined &&
          newExtraPrice !== ''

        const displayPrice = hasNewPrice
          ? Number(newExtraPrice) || 0
          : extraPrice

        const showUnitPrice =
          hasNewPrice && quantity > 1

        const isFree = contentPrice

        const handleRemoveItem = () => {
          handleRemove(index, extra?.exPid)
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

        return (
          <article
            key={extra?.exPid ?? index}
            className={clsx(
              styles.item,
              editing && styles.itemEditing
            )}
          >
            <div className={styles.info}>
              <div className={styles.nameWrapper}>
                <h3 className={styles.title}>
                  {extra?.extraName || 'Sin nombre'}
                </h3>

                {showUnitPrice && !isFree && (
                  <span
                    className={styles.unitPrice}
                    title='Precio unitario'
                  >
                    Precio unitario:{' '}
                    {numberFormat(extraPrice)}
                  </span>
                )}
              </div>

              <div className={styles.priceWrapper}>
                <span
                  className={clsx(
                    styles.price,
                    isFree && styles.priceFree
                  )}
                >
                  {isFree
                    ? 'Gratis'
                    : numberFormat(displayPrice)}
                </span>

                {!isFree && showUnitPrice && (
                  <span className={styles.priceSuffix}>
                    c/u
                  </span>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              {editing ? (
                <RippleButton
                  aria-label={`Eliminar ${extra?.extraName || 'complemento'}`}
                  bgColor='transparent'
                  margin='0'
                  onClick={handleRemoveItem}
                  type='button'
                  widthButton='min-content'
                  className={styles.deleteButton}
                >
                  <Icon
                    icon='IconDelete'
                    color={EColor}
                    size={22}
                  />
                </RippleButton>
              ) : (
                <QuantityButton
                  border='none'
                  disabled={disabled}
                  handleDecrement={handleDecrease}
                  handleIncrement={handleIncrease}
                  padding='5px'
                  quantity={quantity}
                  showNegativeButton={!quantity}
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}
                  validationZero={false}
                  width='min-content'
                />
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

Items.propTypes = {
  dataExtra: PropTypes.arrayOf(
    PropTypes.shape({
      exPid: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]),
      extraName: PropTypes.string,
      extraPrice: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]),
      newExtraPrice: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ]),
      quantity: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number
      ])
    })
  ),
  disabled: PropTypes.bool,
  editing: PropTypes.bool,
  handleDecrementExtra: PropTypes.func,
  handleIncrementExtra: PropTypes.func,
  handleRemove: PropTypes.func
}

export default Items