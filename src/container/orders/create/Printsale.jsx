'use client'

import PropTypes from 'prop-types'
import React, { useEffect, useState } from 'react'
import {
  useStore,
  useFormatDate
} from 'npm-pkg-hook'
import {
  Text,
  Loading,
  numberFormat,
  RippleButton,
  Icon,
  getGlobalStyle
} from 'pkg-components'
import Image from 'next/image'
import {
  ContainerTicket,
  Content,
  Item,
  Ticket
} from './styled'
import { Ticket as TemplateTicket } from './Ticket'

export const Prints = ({
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
    // eslint-disable-next-line
  }, [isPrinting])
  const customDate = `${yearMonthDay} ${longDayName}`

  const dataToPrint = {
    products: data,
    urlLogo : src ? src : src ?? '/images/DEFAULTBANNER.png',
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
    <ContainerTicket>
      <div className='wrapper-action__footer'>
        <RippleButton
          onClick={() => {return handleSubmit()}}
          radius='100%'
          widthButton='60px'
          style={{
            width: '60px',
            height: '60px',
          }}
        >
          <Icon icon='IconSales' color={getGlobalStyle('--color-icons-white')} />
        </RippleButton>
      </div>
      {isPrinting && <Loading />}
      <TemplateTicket componentRef={componentRef} dataToPrint={dataToPrint} />
      <Ticket >
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
            {clientName && <Text fontSize='20px' fontWeight='800'>Cliente</Text>}
            {clientName && <Text>Nombre: {clientName}</Text>}
            {clientNumber && <Text>Numero: {clientNumber}</Text>}
            {ccClient && <Text>CC: {ccClient}</Text>}
          </div>

          <div className='ticket-image'>
            <Image
              alt={''}
              blurDataURL='/images/DEFAULTBANNER.png'
              className='store_image'
              height={200}
              objectFit='scale-down'
              src={src ? src : src ?? '/images/DEFAULTBANNER.png'}
              width={200}
            />
          </div>
          <div className='divider'>
            <div></div>
          </div>
          <Text className='centrado' fontWeight='800'>TICKET DE VENTA</Text>
          <Content>
            <Item>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Total</th>
            </Item>
            {data.map((item) => {
              const ProPrice = `${numberFormat(item?.ProPrice)}`
              const unitPrice = `${numberFormat(item?.unitPrice)}`
              return (
                <React.Fragment key={item.pId}>
                  <Item >
                    <span>{item?.pName || ''}</span>
                    <span>{item?.ProQuantity || 0}</span>
                    <span>{unitPrice || 0}</span>
                    <span>{ProPrice}</span>
                  </Item>
                  {item?.dataExtra?.length > 0 && item?.dataExtra?.map((extra) => {
                    return (
                      <Item key={extra.exPid}>
                        <span>{extra?.extraName || ''}</span>
                        <span>{extra.quantity || 0}</span>
                        <span>{extra?.extraPrice || 0}</span>
                        <span>{extra.newExtraPrice}</span>
                      </Item>
                    )
                  })}
                  {item?.dataOptional?.length > 0 && item?.dataOptional?.map((extraOptional) => {
                    return (
                      <React.Fragment key={extraOptional.opExPid}>
                        <Item>
                          <span style={{ fontWeight: 'bold' }}>{extraOptional?.OptionalProName || ''}</span>
                        </Item>
                        {extraOptional?.ExtProductFoodsSubOptionalAll?.map((extraOptional) => {
                          return (
                            <Item key={extraOptional?.exPid}>
                              <span>{extraOptional?.OptionalSubProName || ''}</span>
                              <span>{1}</span>
                              <span>Gratis</span>
                              <span>{0}</span>
                            </Item>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              )})}
          </Content>
          <div className='wrapper__sub-items'>
            <div className='sub-items'>
              <div className='sub-item__values'>
              </div>
              <div className='sub-item__values'>
                {change &&
               <div className='item--values'>
                 <Text fontWeight='bold'>CAMBIO &nbsp;</Text>
                 <Text fontWeight='bold'>{numberFormat(change)}</Text>
               </div>
                }
                {total &&
               <div className='item--values'>
                 <Text fontWeight='bold'>TOTAL &nbsp;</Text>
                 <Text fontWeight='bold'>{numberFormat(total)}</Text>
               </div>
                }

              </div>
            </div>
          </div>
          <Text
            align='center'
            as='h3'
            fontWeight='bold'
            justifyContent='center'
            margin='40px 0'
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
      </Ticket>
    </ContainerTicket>
  )
}
Prints.propTypes = {
  change: PropTypes.any,
  code: PropTypes.any,
  componentRef: PropTypes.any,
  data: PropTypes.shape({
    map: PropTypes.func
  }),
  dataClientes: PropTypes.array,
  discount: PropTypes.object,
  handleSubmit: PropTypes.func,
  isPrinting: PropTypes.any,
  paymentMethod: PropTypes.any,
  promiseResolveRef: PropTypes.shape({
    current: PropTypes.func
  }),
  total: PropTypes.any,
  values: PropTypes.shape({
    cliId: PropTypes.any
  })
}
