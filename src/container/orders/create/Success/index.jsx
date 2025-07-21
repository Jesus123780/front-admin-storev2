import PropTypes from 'prop-types'
import React from 'react'
import {
  AwesomeModal,
  Text,
  Loading,
  Icon,
  getGlobalStyle,
  Divider,
  AlertInfo
} from 'pkg-components'
import styles from './styles.module.css'

export const SuccessSaleModal = ({
  code,
  router = { push: (args) => { return args } },
  loading = false,
  openCurrentSale = false,
  products = [],
  setOpenCurrentSale = (boolean) => { return boolean },
  dispatch = (args) => { return args },
  handlePrint = () => { return },
  handleDownLoad = () => { return },
  handleCloseModal = () => { return }
}) => {

  const formatter = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' })
  const ListFormat = products.map(product => {
    return product?.pName
  }).slice(0, 3)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const finalListFormat = formatter?.format(ListFormat) || ''

  const arrayOptions = [
    {
      id: 1,
      title: 'Tu pedido se ha generado',
      subtitle: code,
      action: 'Mirar pedido',
      icon: 'IconSales',
      tooltip: 'Puedes mirar el resumen del pedido y el estado.',
      onClick: () => {
        window.location.href = `${process.env.NEXT_PUBLIC_URL_BASE}/orders?saleId=${code}`
        return handleCloseModal()
       }
    },
    {
      id: 2,
      title: 'Descarga tu pedido en formato PDF',
      subtitle: null,
      action: 'Descargar',
      icon: 'IconDownload',
      tooltip: 'Descarga tu pedido en formato PDF.',
      onClick: () => { return handleDownLoad() }
    },
    {
      id: 3,
      title: 'Desea imprimir la factura de venta?',
      subtitle: null,
      action: 'Imprimir',
      icon: 'IconTicket',
      tooltip: 'Desea imprimir la factura de venta?',
      onClick: () => { return handlePrint() }
    }
  ]

  return (
    <AwesomeModal
      btnConfirm={false}
      customHeight='100%'
      footer={false}
      header={true}
      height='100%'
      onCancel={() => {
        dispatch({ type: 'REMOVE_ALL_PRODUCTS' })
        return setOpenCurrentSale(false)
      }}
      onHide={() => {
        dispatch({ type: 'REMOVE_ALL_PRODUCTS' })
        return setOpenCurrentSale(false)
      }}
      show={openCurrentSale}
      size='100%'
      zIndex={getGlobalStyle('--z-index-modal')}
    >
      {/* {loading && <Loading />} */}
      <div>
        <div className={styles['container__success-invoice']} >
          <Text size='xl' >Resumen de pedido ref: # <Text color='primary' size='xxl' >{code}</Text></Text>

          {arrayOptions.map((option) => {
            return (
              <React.Fragment key={option.id}>
                <div
                  className={styles['wrapper__success-invoice']}
                >
                  <div>
                    <Icon
                      height={30}
                      icon='IconArrowRight'
                      width={30}
                    />
                  </div>
                  <div>
                    <div className={styles['card__success-invoice']} onClick={option.onClick}>
                      <div className={styles['card__success-invoice-icon']} >
                        <Icon
                          color={getGlobalStyle('--color-icons-primary')}
                          height={30}
                          icon={option.icon}
                          size={30}
                          width={30}
                        />
                      </div>
                      <div className={styles['card__success-invoice-content']} >
                        <div>
                          <Icon
                            color={getGlobalStyle('--color-icons-primary')}
                            height={30}
                            icon='IconLogo'
                            size={30}
                            width={30}
                          />
                        </div>
                        <Text size='sm' >{option.title} {option.subtitle}</Text>
                      </div>
                      <div className={styles['card__success-invoice-action']} >
                        <Icon
                          color={getGlobalStyle('--color-icons-primary')}
                          height={30}
                          icon='IconArrowRight'
                          width={30}
                        />
                      </div>
                    </div>            
                  </div>
                </div>
                <Divider marginBottom='0.9375rem' />
              </React.Fragment>
            )
          })}
        </div>
        <Divider marginBottom='0.9375rem' />
        <AlertInfo message={`Mira y gestiona tus pedidos realizados en tienda ${process.env.BUSINESS_TITLE}`} type='warning' />
      </div>

    </AwesomeModal>
  )
}

SuccessSaleModal.propTypes = {
  code: PropTypes.any,
  dispatch: PropTypes.func,
  handleCloseModal: PropTypes.func,
  handleDownLoad: PropTypes.func,
  handlePrint: PropTypes.func,
  loading: PropTypes.bool,
  openCurrentSale: PropTypes.any,
  products: PropTypes.array,
  setOpenCurrentSale: PropTypes.func
}

