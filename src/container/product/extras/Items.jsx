import {
  EColor,
  Icon,
  numberFormat,
  QuantityButton,
  RippleButton
} from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'


const Items = ({
  editing,
  dataExtra = [],
  disabled = false,
  handleRemove = (index, extra) => {
    return { index, extra }
  },
  handleIncrementExtra = ({ Adicionales, index }) => {
    return { Adicionales, index }
  },
  handleDecrementExtra = ({ Adicionales = {} }) => {
    return Adicionales
  }
}) => {
  return (
    <div>
      {dataExtra?.map((extra, index) => {
        const contentPrice = extra.extraPrice === 0 && extra.quantity == 0
        return (
          <div key={extra.exPid}>
            <div>
              <div>
                <h3 className='title_card'>
                  {extra?.extraName || ''}
                </h3>
                <div style={{ position: 'relative' }}>
                  {!!extra?.newExtraPrice && extra.quantity > 1 && (
                    <span className='price-neto' title='precio neto'>
                      {' '}
                      {!contentPrice
                        ? `Unit Price: ${numberFormat(
                          extra?.extraPrice || 0
                        )}`
                        : 'Gratis'}
                    </span>
                  )}
                  <h3 className={`price-${!contentPrice ? 'value' : 'free'}`}>
                    {' '}
                    {!contentPrice
                      ? `${numberFormat(
                        (extra?.newExtraPrice ?? extra.extraPrice) || 0
                      )}`
                      : 'Gratis'}
                  </h3>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  width: editing ? 'auto' : 'min-content'
                }}
              >
                {editing && (
                  <RippleButton
                    bgColor={'transparent'}
                    margin='0px'
                    onClick={() => {
                      const exPid = extra.exPid
                      return handleRemove(index, exPid)
                    }}
                    type='button'
                    widthButton='min-content'
                  >
                    <Icon icon='IconDelete' color={EColor} size={25} />
                  </RippleButton>
                )}
                {!editing && (
                  <QuantityButton
                    border='none'
                    disabled={disabled}
                    handleDecrement={() => {
                      return handleDecrementExtra({
                        Adicionales: extra,
                        index
                      })
                    }}
                    handleIncrement={() => {
                      return handleIncrementExtra({
                        Adicionales: extra,
                        index
                      })
                    }}
                    padding='5px'
                    quantity={extra.quantity || 0}
                    showNegativeButton={!extra.quantity}
                    style={{ display: 'flex', justifyContent: 'flex-end' }}
                    validationZero={false}
                    width='min-content'
                  />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

Items.propTypes = {
  dataExtra: PropTypes.shape({
    map: PropTypes.func
  }),
  disabled: PropTypes.bool,
  editing: PropTypes.any,
  handleDecrementExtra: PropTypes.func,
  handleDeleteAdditional: PropTypes.func,
  handleIncrementExtra: PropTypes.func,
  handleRemove: PropTypes.func
}

export default Items
