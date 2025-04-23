import PropTypes from 'prop-types'
import { 
  getGlobalStyle, 
  MiniCardProduct, 
  numberFormat
} from 'pkg-components'
import React from 'react'
import styles from './styles.module.css'

export const ListData = ({
  data = [],
  updateProductQuantity = () => { return null },
  handleToggleEditingStatus = () => { return null },
  handleSuccessUpdateQuantity = () => { return null },
  handleCancelUpdateQuantity = () => { return null },
  handleChangeQuantity = () => { return null },
  handleCheckFree = () => { return null }
}) => {
  return (
    <>
      <div className={styles.content_products}>
        {data.map((item, index) => {
          return (
            <div
              key={index}
              style={{
                borderTop: getGlobalStyle('--spacing-4xl')
              }}
            >
              <MiniCardProduct
                ProDescription={item['DESCRIPCION']}
                ProPrice={numberFormat(item['PRECIO_AL_PUBLICO'])}
                ProQuantity={item['CANTIDAD']}
                editable={true}
                editing={item.editing}
                free={item.free}
                handleCancelUpdateQuantity={() => {return handleCancelUpdateQuantity(index)}}
                handleChangeQuantity={(event) => {
                  handleChangeQuantity(event, index)
                }}
                handleDecrement={() => {return updateProductQuantity(index, -1)}}
                handleFreeProducts={() => {return handleCheckFree(index)}}
                handleIncrement={() => {return updateProductQuantity(index, 1)}}
                handleSuccessUpdateQuantity={() => {return handleSuccessUpdateQuantity(index)}}
                handleToggleEditingStatus={() => {return handleToggleEditingStatus(index)}}
                hoverFree={true}
                openQuantity={true}
                pName={item['NOMBRE']}
                stock={item['CANTIDAD']}
                withQuantity={true}
                withStock={true}
              />
            </div>
          )
        })}
      </div>
     
    </>
  )
}

ListData.propTypes = {
  data: PropTypes.array,
  handleCancelUpdateQuantity: PropTypes.func,
  handleChangeQuantity: PropTypes.func,
  handleCheckFree: PropTypes.func,
  handleSuccessUpdateQuantity: PropTypes.func,
  handleToggleEditingStatus: PropTypes.func,
  updateProductQuantity: PropTypes.func,
  updateProducts: PropTypes.func
}
