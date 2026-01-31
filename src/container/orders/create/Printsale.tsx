'use client'

import {
  useFormatDate,
  useStore
} from 'npm-pkg-hook'
import {
  getGlobalStyle,
  Icon,
  numberFormat,
  RippleButton,
  Text
} from 'pkg-components'
import React, { useEffect, useState } from 'react'

import { Ticket as TemplateTicket } from './Ticket'

interface PrintsMemoProps {
  data: unknown[]
  dataClientes?: unknown[]
  values: unknown
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
  handleSubmit = () => { return }
}) => {
  const [dataStore] = useStore()
  const [client, setClient] = useState({})
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
    (() => {
      if (dataClientes?.length > 0) {
        const client = dataClientes?.find((client) => {
          return client && client?.cliId === values?.cliId
        })
        setClient(client)
      }
    })()
  }, [dataClientes, values.cliId])
  const {
    clientName,
    ccClient,
    ClientAddress,
    clientNumber
  } = client || {}


  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
      promiseResolveRef.current()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPrinting])

  const customDate = `${yearMonthDay} ${longDayName}`

  const dataToPrint = {
    products: data,
    urlLogo: src ? src : src ?? '/images/DEFAULTBANNER.png',
    addressStore: addressStore ?? ULocation ?? ClientAddress,
    storePhone: storePhone ?? uPhoNum,
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
  return (
    <div>
      <div className='wrapper-action__footer'>
        <RippleButton
          onClick={() => { return handleSubmit() }}
          radius='100%'
          style={{
            width: '60px',
            height: '60px',
          }}
        >
          <Icon icon='IconSales' color={getGlobalStyle('--color-icons-white')} />
        </RippleButton>
      </div>
      {/* {isPrinting && <Loading />} */}
      <TemplateTicket componentRef={componentRef} dataToPrint={dataToPrint} />
      <div>
        <div
          className='ticket'
          id='ticket'
        >
          <div className='ticket-info_client_restaurant'>
            <div className='wrapper__arrow_button' />
            <h5>{storeName ?? 'Nombre Empresa'}</h5>
            <Text>NIT:</Text>
            <Text>Dirección: {addressStore ?? ULocation ?? ClientAddress}</Text>
            <Text>Teléfono: {storePhone ?? uPhoNum} </Text>
            {/* <Text>Fecha: {customDate}</Text> */}
            {clientName && <Text>Cliente</Text>}
            {clientName && <Text>Nombre: {clientName}</Text>}
            {clientNumber && <Text>Numero: {clientNumber}</Text>}
            {ccClient && <Text>CC: {ccClient}</Text>}
          </div>

          <div className='ticket-image'>
            {/* <Image
              alt={''}
              blurDataURL='/images/DEFAULTBANNER.png'
              className='store_image'
              height={200}
              objectFit='scale-down'
              src={src ? src : src ?? '/images/DEFAULTBANNER.png'}
              width={200}
            /> */}
          </div>
          <div className='divider'>
            <div></div>
          </div>
          <Text>
            TICKET DE VENTA
          </Text>
          <div>
            <div>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
            </div>
            {data.map((div) => {
              const ProPrice = numberFormat(div?.ProPrice)
              const unitPrice = numberFormat(div?.unitPrice)
              return (
                <React.Fragment key={div.pId}>
                  <div >
                    <Text>
                      {String(div?.pName ?? '')}
                    </Text>
                    <Text>
                      {Number(div?.ProQuantity ?? 0)}
                    </Text>
                    <Text>
                      {Number(unitPrice ?? 0)}
                    </Text>
                    <Text>
                      {ProPrice}
                    </Text>
                  </div>
                  {div?.dataExtra?.length > 0 && div?.dataExtra?.map((extra) => {
                    return (
                      <div key={extra.exPid}>
                        <Text>
                          {extra?.extraName || ''}
                        </Text>
                        <Text>
                          {extra.quantity || 0}
                        </Text>
                        <Text>
                          {extra?.extraPrice || 0}
                        </Text>
                        <Text>
                          {extra.newExtraPrice}
                        </Text>
                      </div>
                    )
                  })}
                  {div?.dataOptional?.length > 0 && div?.dataOptional?.map((extraOptional) => {
                    return (
                      <React.Fragment key={extraOptional.opExPid}>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>{extraOptional?.OptionalProName || ''}</span>
                        </div>
                        {extraOptional?.ExtProductFoodsSubOptionalAll?.map((extraOptional) => {
                          return (
                            <div key={extraOptional?.exPid}>
                              <span>{extraOptional?.OptionalSubProName || ''}</span>
                              <span>{1}</span>
                              <span>Gratis</span>
                              <span>{0}</span>
                            </div>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </div>
          <div className='wrapper__sub-divs'>
            <div className='sub-divs'>
              <div className='sub-div__values'>
              </div>
              <div className='sub-div__values'>
                {change &&
                  <div className='div--values'>
                    <Text>CAMBIO &nbsp;</Text>
                    <Text>{numberFormat(change)}</Text>
                  </div>
                }
                {total &&
                  <div className='div--values'>
                    <Text>TOTAL &nbsp;</Text>
                    <Text>{numberFormat(total)}</Text>
                  </div>
                }

              </div>
            </div>
          </div>
          <Text
            align='center'
            as='h3'
          >
            Gracias por su compra
          </Text>

          <div className='wrapper__arrow_button' style={{ display: 'flex' }}>
            {Array(25).fill('').map((ele, i) => {
              return (
                <div className='arrow_button' key={i} />
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
// memo
export const Prints = React.memo(PrintsMemo)

