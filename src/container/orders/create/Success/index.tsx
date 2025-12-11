import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import {
  AlertInfo,
  AwesomeModal,
  Divider,
  getGlobalStyle,
  Icon,
  ROUTES,
  Text
} from 'pkg-components'
import React from 'react'

import styles from './styles.module.css'

interface ISuccessSaleModal {
  code: string
  router: AppRouterInstance
  openCurrentSale: boolean
  setOpenCurrentSale: (boolean: boolean) => void
  dispatch: (args: unknown) => void
  handlePrint: () => void
  handleDownLoad: () => void
  handleCloseModal: () => void
}

export const SuccessSaleModal: React.FC<ISuccessSaleModal> = ({
  code,
  router,
  openCurrentSale = false,
  setOpenCurrentSale = (boolean) => { return boolean },
  dispatch = (args) => { return args },
  handlePrint = () => { return },
  handleDownLoad = () => { return },
  handleCloseModal = () => { return }
}) => {

  const arrayOptions = [
    {
      id: 1,
      title: 'Tu pedido se ha generado',
      subtitle: code,
      action: 'Mirar pedido',
      icon: 'IconSales',
      tooltip: 'Puedes mirar el resumen del pedido y el estado.',
      onClick: () => {
        handleCloseModal()
        return  router.push(`${ROUTES.orders}/${code}`)
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
          <Text as='h2' size='xl' >
            Resumen de pedido ref: #
            <Text color='primary' size='xxl' >
              {code}
            </Text>
          </Text>

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
                          icon={option.icon}
                          size={30}
                        />
                      </div>
                      <div className={styles['card__success-invoice-content']} >
                        <div>
                          <Icon
                            color={getGlobalStyle('--color-icons-primary')}
                            icon='IconLogo'
                            size={30}
                          />
                        </div>
                        <Text size='sm' >{option.title} {option.subtitle}</Text>
                      </div>
                      <div className={styles['card__success-invoice-action']} >
                        <Icon
                          color={getGlobalStyle('--color-icons-primary')}
                          icon='IconArrowRight'
                          size={30}
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
        <AlertInfo message={`Mira y gestiona tus pedidos realizados en tienda ${process.env.NEXT_PUBLIC_BUSINESS_TITLE}`} type='warning' />
      </div>

    </AwesomeModal>
  )
}
