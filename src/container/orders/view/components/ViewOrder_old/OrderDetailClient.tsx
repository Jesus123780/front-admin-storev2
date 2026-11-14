
'use client'

import {
  useGetSale,
  usePrintSaleTicket
} from 'npm-pkg-hook'
import {
  Icon,
  RippleButton
} from 'pkg-components'
import {
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'

import OrderDetail from '@/container/orders/view/components/ViewOrder'
import { Context } from '@/context/Context'

import type { Order } from '../types/order'
import styles from './order-detail-client.module.css'

type Props = {
  orderId: string
}

export interface SaleResponse {
  getOneSalesStore: {
    data: Order | null
    message?: string
    errors?: Array<{ message?: string }> | null
  }
}

type RequestState =
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string }

interface OrderErrorStateProps {
  message: string
  onRetry?: () => void
}

const OrderErrorState = ({
  message,
  onRetry
}: OrderErrorStateProps) => {
  return (
    <section className={styles.errorContainer}>
      <div className={styles.errorContent}>
        <div
          className={styles.errorIcon}
          aria-hidden='true'
        >
          <Icon
            icon='IconWarning'
            size={34}
            color='var(--color-icons-gray)'
          />
        </div>

        <div className={styles.errorInformation} role='alert'>
          <h2 className={styles.errorTitle}>
            No pudimos cargar la orden
          </h2>

          <p className={styles.errorDescription}>
            {message}
          </p>
        </div>

        {onRetry && (
          <div className={styles.actions}>
            <RippleButton
              type='button'
              radius='12px'
              padding='14px 24px'
              onClick={onRetry}
            >
              <span className={styles.retryButton}>
                <span aria-hidden='true'>
                  <Icon
                    icon='IconReload'
                    size={18}
                    color='#ffffff'
                  />
                </span>

                Reintentar consulta
              </span>
            </RippleButton>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Cada instancia representa exclusivamente una orden.
 * Apollo Client administra los datos de la consulta.
 */
function OrderDetailContent({ orderId }: Props) {
  const { sendNotification } = useContext(Context)

  const {
    getOneSalesStore,
    data,
    loading
  } = useGetSale()

  const [handlePrintSale] = usePrintSaleTicket()

  const [attempt, setAttempt] = useState(0)

  const [request, setRequest] = useState<RequestState>({
    status: 'loading'
  })

  const sale = data as
    | SaleResponse['getOneSalesStore']
    | undefined

  const order = sale?.data ?? null
  const orderCode = order?.pCodeRef?.trim()

  /**
   * Consulta inicial y reintentos.
   *
   * No duplicamos la respuesta de Apollo en un useState.
   * El indicador current evita actualizar nuestro estado
   * cuando la instancia ya no está activa.
   */
  useEffect(() => {
    let current = true

    const fetchOrder = async (): Promise<void> => {
      setRequest({ status: 'loading' })

      try {
        const response = await getOneSalesStore({
          variables: {
            pCodeRef: orderId
          },
          fetchPolicy: 'no-cache'
        })
        if (!current) {return}

        if (response.error) {
          throw response.error
        }

        const result = (
          response.data as SaleResponse | undefined
        )?.getOneSalesStore

        if (result?.errors?.length) {
          setRequest({
            status: 'error',
            message: 'No fue posible consultar esta orden.'
          })

          return
        }

        if (!result?.data) {
          setRequest({
            status: 'error',
            message: 'No encontramos información para esta orden.'
          })

          return
        }

        setRequest({
          status: 'success'
        })
      } catch {
        if (!current) {return}

        setRequest({
          status: 'error',
          message:
            'Ocurrió un inconveniente al consultar la información. Intenta nuevamente.'
        })
      }
    }

    void fetchOrder()

    return () => {
      current = false
    }
  }, [orderId, attempt, getOneSalesStore])

  const handleRetry = useCallback(() => {
    setRequest({ status: 'loading' })
    setAttempt(previous => previous + 1)
  }, [])

  /**
   * OrderActions administra el estado visual de impresión.
   * Este adaptador solamente ejecuta la operación.
   */
  const handleClickPrint = useCallback(async (): Promise<void> => {
    if (!orderCode) {
      throw new Error('La orden no tiene un código válido.')
    }

    if (typeof handlePrintSale !== 'function') {
      throw new Error('El servicio de impresión no está disponible.')
    }

    const response = await handlePrintSale(orderCode)
      .catch(() => undefined)

    if (!response?.success) {
      const message =
        response?.message ||
        'No fue posible enviar el comprobante a la impresora.'

      sendNotification({
        title: 'Error al imprimir',
        description: message,
        backgroundColor: 'error'
      })

      // OrderActions recibe el rechazo y actualiza
      // correctamente su estado visual.
      throw new Error(message)
    }

    sendNotification({
      title: 'Impresión enviada',
      description:
        response.message ||
        'El comprobante fue enviado correctamente.',
      backgroundColor: 'success'
    })
  }, [
    orderCode,
    handlePrintSale,
    sendNotification
  ])

  if (request.status === 'loading') {
    return (
      <OrderDetail
        order={null}
        loading
      />
    )
  }

  if (request.status === 'error') {
    return (
      <OrderErrorState
        message={request.message}
        onRetry={handleRetry}
      />
    )
  }
  console.log({order})
  return (
    <OrderDetail
      order={order}
      loading={loading}
      modalView={false}
      handlePrint={handleClickPrint}
    />
  )
}

/**
 * Reinicia el ciclo de vida al cambiar de orden.
 */
export default function OrderDetailClient({
  orderId
}: Props) {
  const normalizedOrderId = orderId?.trim()

  if (!normalizedOrderId) {
    return (
      <OrderErrorState
        message='El identificador de la orden no es válido.'
      />
    )
  }

  return (
    <OrderDetailContent
      key={normalizedOrderId}
      orderId={normalizedOrderId}
    />
  )
}
