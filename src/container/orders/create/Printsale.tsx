'use client'

import {
  useFormatDate,
  useStore
} from 'npm-pkg-hook'
import {
  getGlobalStyle,
  Icon,
  Image,
  numberFormat,
  RippleButton
} from 'pkg-components'
import React, { useEffect, useState } from 'react'

import styles from './Prints.module.css'

interface PrintsMemoProps {
  data: unknown[]
  dataClientes?: unknown[]
  values: any
  paymentMethod: string
  handleSubmit?: () => void
  code: string
  change: number
  total: number
  isPrinting: boolean
  promiseResolveRef: React.MutableRefObject<(() => void) | null>
  discount?: {
    type: string
    value: number
  }
  componentRef: React.RefObject<HTMLDivElement>
}

export const PrintsMemo: React.FC<PrintsMemoProps> = ({
  data,
  code,
  change,
  total,
  isPrinting,
  promiseResolveRef,
  discount = {},
  componentRef,
  dataClientes = [],
  values,
  paymentMethod,
  handleSubmit = () => {}
}) => {
  const [dataStore] = useStore()
  const [client, setClient] = useState<any>({})

  const {
    storeName,
    Image: src,
    storePhone,
    NitStore,
    ULocation,
    addressStore,
    uPhoNum
  } = dataStore || {}

  const { yearMonthDay, longDayName } = useFormatDate({})

  useEffect(() => {
    if (!dataClientes?.length) {
      setClient({})
      return
    }

    const selectedClient = dataClientes.find(
      (item: any) => item?.cliId === values?.cliId
    )

    setClient(selectedClient || {})
  }, [dataClientes, values?.cliId])

  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
      promiseResolveRef.current()
    }
  }, [isPrinting, promiseResolveRef])

  const {
    clientName,
    ccClient,
    ClientAddress,
    clientNumber
  } = client || {}

  const customDate = `${yearMonthDay} ${longDayName}`

  /**
   * Normaliza los valores numéricos
   * para evitar NaN en el ticket.
   */
  const normalizedProducts: Record<string, any>[] = (
    Array.isArray(data) ? data : []
  ).map((product) => {
    const item = (product ?? {}) as Record<string, any>

    return {
      ...item,
      unitPrice: Number(item?.unitPrice) || 0,
      ProQuantity: Number(item?.ProQuantity) || 0,
      ProPrice: Number(item?.ProPrice) || 0
    }
  })

  const storeAddress =
    addressStore ??
    ULocation ??
    ClientAddress ??
    'SIN DEFINIR'

  const storeTelephone =
    storePhone ??
    uPhoNum ??
    'SIN DEFINIR'

  const dataToPrint = {
    products: normalizedProducts,
    urlLogo: src || '/images/DEFAULTBANNER.png',
    addressStore: storeAddress,
    storePhone: storeTelephone,
    date: customDate,
    client: {
      clientName,
      clientNumber,
      ccClient,
      ...client
    },
    ref: code,
    total,
    paymentMethod,
    change,
    NitStore,
    discount,
    storeName,
    ...dataStore
  }

  const hasClientInfo = Boolean(
    clientName ||
    clientNumber ||
    ccClient
  )

  return (
    <div className={styles.page}>
    
      <div className={styles.ticketWrapper}>
        <div
          className={styles.ticket}
          id="ticket"
        >
          <header className={styles.header}>
            {src && (
              <div className={styles.logoWrapper}>
                <Image
                  src={src}
                  alt={storeName || 'Logo del comercio'}
                  className={styles.logo}
                />
              </div>
            )}

            <h1 className={styles.storeName}>
              {storeName ?? 'Nombre Empresa'}
            </h1>

            <div className={styles.storeInfo}>
              <span>
                NIT: {NitStore ?? 'SIN DEFINIR'}
              </span>

              <span>
                {storeAddress}
              </span>

              <span>
                Tel: {storeTelephone}
              </span>
            </div>
          </header>

          {/* ================================
              REFERENCIA DE LA VENTA
          ================================= */}

          <div className={styles.reference}>
            <span className={styles.referenceLabel}>
              Venta
            </span>

            <span className={styles.referenceCode}>
              #{code}
            </span>

            <span className={styles.referenceDate}>
              {customDate}
            </span>
          </div>

          {/* ================================
              INFORMACIÓN DEL CLIENTE
          ================================= */}

          {hasClientInfo && (
            <section className={styles.clientBox}>
              <div className={styles.sectionTitle}>
                Datos del cliente
              </div>

              <div className={styles.clientGrid}>
                {clientName && (
                  <div className={styles.clientItem}>
                    <span>Nombre</span>
                    <strong>{clientName}</strong>
                  </div>
                )}

                {ccClient && (
                  <div className={styles.clientItem}>
                    <span>Documento</span>
                    <strong>{ccClient}</strong>
                  </div>
                )}

                {clientNumber && (
                  <div className={styles.clientItem}>
                    <span>Teléfono</span>
                    <strong>{clientNumber}</strong>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className={styles.divider} />

          {/* ================================
              TÍTULO
          ================================= */}

          <div className={styles.ticketTitle}>
            <span className={styles.ticketTitleLine} />

            <h2>
              TICKET DE VENTA
            </h2>

            <span className={styles.ticketTitleLine} />
          </div>

          {/* ================================
              PRODUCTOS
          ================================= */}

          <section className={styles.products}>
            <div className={styles.tableHead}>
              <span>Descripción</span>
              <span>Cant.</span>
              <span>Precio</span>
              <span>Total</span>
            </div>

            <div className={styles.tableBody}>
              {normalizedProducts.map((product) => {
                const productPrice = numberFormat(
                  product?.ProPrice
                )

                const unitPrice = numberFormat(
                  product?.unitPrice
                )

                return (
                  <React.Fragment key={product.pId}>
                    {/* Producto principal */}

                    <div className={styles.productRow}>
                      <span className={styles.description}>
                        {String(product?.pName ?? '')}
                      </span>

                      <span className={styles.number}>
                        {Number(
                          product?.ProQuantity ?? 0
                        )}
                      </span>

                      <span className={styles.number}>
                        {unitPrice}
                      </span>

                      <strong className={styles.number}>
                        {productPrice}
                      </strong>
                    </div>

                    {/* Extras */}

                    {product?.dataExtra?.length > 0 &&
                      product.dataExtra.map(
                        (extra: any) => (
                          <div
                            className={styles.extraRow}
                            key={extra.exPid}
                          >
                            <span
                              className={
                                styles.description
                              }
                            >
                              <span
                                className={
                                  styles.extraIndicator
                                }
                              >
                                +
                              </span>

                              {extra?.extraName || ''}
                            </span>

                            <span
                              className={styles.number}
                            >
                              {extra.quantity || 0}
                            </span>

                            <span
                              className={styles.number}
                            >
                              {extra?.extraPrice || 0}
                            </span>

                            <span
                              className={styles.number}
                            >
                              {extra?.newExtraPrice || 0}
                            </span>
                          </div>
                        )
                      )}

                    {/* Opcionales */}

                    {product?.dataOptional?.length > 0 &&
                      product.dataOptional.map(
                        (optional: any) => (
                          <React.Fragment
                            key={optional.opExPid}
                          >
                            <div
                              className={
                                styles.optionalRow
                              }
                            >
                              <span>
                                {
                                  optional?.OptionalProName ||
                                  ''
                                }
                              </span>
                            </div>

                            {optional
                              ?.ExtProductFoodsSubOptionalAll
                              ?.map(
                                (subOptional: any) => (
                                  <div
                                    className={
                                      styles.extraRow
                                    }
                                    key={
                                      subOptional?.exPid
                                    }
                                  >
                                    <span
                                      className={
                                        styles.description
                                      }
                                    >
                                      {
                                        subOptional?.OptionalSubProName ||
                                        ''
                                      }
                                    </span>

                                    <span
                                      className={
                                        styles.number
                                      }
                                    >
                                      1
                                    </span>

                                    <span
                                      className={
                                        styles.free
                                      }
                                    >
                                      Gratis
                                    </span>

                                    <span
                                      className={
                                        styles.number
                                      }
                                    >
                                      0
                                    </span>
                                  </div>
                                )
                              )}
                          </React.Fragment>
                        )
                      )}
                  </React.Fragment>
                )
              })}
            </div>
          </section>

          <div className={styles.divider} />

          {/* ================================
              RESUMEN
          ================================= */}

          <section className={styles.summary}>
            {Boolean(change) && (
              <div className={styles.summaryRow}>
                <span>
                  Cambio
                </span>

                <span>
                  {numberFormat(change)}
                </span>
              </div>
            )}

            <div className={styles.totalRow}>
              <span>
                Total
              </span>

              <strong>
                {numberFormat(total)}
              </strong>
            </div>

            {paymentMethod && (
              <div className={styles.paymentMethod}>
                <span>
                  Método de pago
                </span>

                <strong>
                  {paymentMethod}
                </strong>
              </div>
            )}
          </section>

          {/* ================================
              FOOTER
          ================================= */}

          <footer className={styles.footer}>
            <p className={styles.thanks}>
              Gracias por su compra
            </p>

            <p className={styles.footerMessage}>
              Conserve este comprobante
            </p>
          </footer>

          {/* Borde tipo recibo */}

          <div className={styles.zigzag} />
        </div>
      </div>

      {/* ================================
          BOTÓN DE ACCIÓN
      ================================= */}

      <div className={styles.actionFooter}>
        <RippleButton
          onClick={handleSubmit}
        >
          <Icon
            icon="IconSales"
            color={getGlobalStyle(
              '--color-icons-white'
            )}
          />
        </RippleButton>
      </div>
    </div>
  )
}

export const Prints = React.memo(PrintsMemo)
