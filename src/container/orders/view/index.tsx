
'use client'

import {
  useGetSale,
  useManageQueryParams,
  useOrdersFromStore,
  useOrderStatusTypes,
  usePrintSaleTicket
} from 'npm-pkg-hook'

import { Icon, Text } from 'pkg-components'
import { EOrderQueryParams } from 'pkg-components/stories/organisms/ModalDetailOrder/type'

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { Context } from '@/context/Context'

import { DragOrders } from './components/DragOrders'
import { ListOrders } from './components/ListOrders'
import { ModalOrder } from './components/ModalOrder'
import { ModalQueries } from './components/ModalQueries'
import { ModalStatusTypes } from './components/ModalStatusTypes'
import { OrdersSummary } from './components/OrdersSummary'
import { OrdersToolbar } from './components/OrdersToolbar'
import {
  OrdersEmpty,
  OrdersError,
  OrdersSkeleton
} from './components/OrdersStates'

import type {
  DateRangeValue,
  OrderDetailsState,
  OrderRecord,
  OrdersLayout,
  OrdersPreset,
  OrdersSort
} from './types'

import {
  applyOrderFilters,
  extractSale,
  formatOrderDate,
  normalizeStatusTypes,
  orderStatusName,
  presetRange
} from '../utils/orders'

import { exportOrderPdf } from '../utils/exportOrderPdf'
import styles from './styles.module.css'

export interface OrdersViewProps {
  query?: EOrderQueryParams
}

const EMPTY_DETAIL: OrderDetailsState = {
  open: false,
  code: '',
  loading: false,
  error: null,
  order: null
}

const SEARCH_DEBOUNCE_MS = 360

export function OrdersView({ query }: OrdersViewProps) {
  const { sendNotification } = useContext(Context)

  // --------------------------------------------
  // Visualización y filtros
  // --------------------------------------------

  const [layout, setLayout] = useState<OrdersLayout>('columns')
  const [sort, setSort] = useState<OrdersSort>('newest')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])

  const [preset, setPreset] = useState<OrdersPreset>('today')

  const [range, setRange] = useState<DateRangeValue>(
    () => presetRange('today')
  )

  const [manualRefreshing, setManualRefreshing] = useState(false)

  // --------------------------------------------
  // Modales
  // --------------------------------------------

  const [openDateFilter, setOpenDateFilter] = useState(false)
  const [openManageStatuses, setOpenManageStatuses] = useState(false)
  const [detail, setDetail] = useState<OrderDetailsState>(EMPTY_DETAIL)
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null)

  const detailSequence = useRef(0)
  const didInitDeepLink = useRef(false)

  // --------------------------------------------
  // Servicios y navegación
  // --------------------------------------------

  const statusQuery = useOrderStatusTypes()

  const statuses = useMemo(
    () => normalizeStatusTypes(statusQuery.data),
    [statusQuery.data]
  )

  const { handleQuery, getParams } = useManageQueryParams()

  const routeCodeParam: unknown =
    query === EOrderQueryParams.CODE
      ? getParams<{ CODE: string }>(EOrderQueryParams.CODE)
      : null

  const { handleGetSale } = useGetSale()
  const [handlePrintSale] = usePrintSaleTicket()

  // --------------------------------------------
  // Búsqueda con debounce
  // --------------------------------------------

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [search])

  // --------------------------------------------
  // Consulta principal
  //
  // Apollo ejecuta una nueva consulta cuando
  // cambian las fechas o debouncedSearch.
  // --------------------------------------------

  const [
    ,
    {
      orders: queriedOrders,
      refetch,
      loading,
      error: ordersError,
      networkStatus
    }
  ] = useOrdersFromStore({
    fromDate: range.fromDate,
    toDate: range.toDate,
    search: debouncedSearch
  })

  const orders = queriedOrders as OrderRecord[]

  const initialLoading =
    loading &&
    orders.length === 0 &&
    !ordersError

  const refreshing =
    manualRefreshing ||
    (loading && networkStatus !== 1)

  const listError = ordersError
    ? 'No fue posible consultar las órdenes. Verifica la conexión e intenta nuevamente.'
    : null

  // --------------------------------------------
  // Actualización manual
  // --------------------------------------------

  const refresh = useCallback(async () => {
    const currentSearch = search.trim()

    // Si el usuario todavía está escribiendo,
    // aplicamos primero la búsqueda pendiente.
    // Apollo hará automáticamente la consulta.
    if (currentSearch !== debouncedSearch) {
      setDebouncedSearch(currentSearch)
      return
    }

    setManualRefreshing(true)

    try {
      await refetch()
    } catch {
      sendNotification({
        title: 'Error al actualizar',
        description: 'No fue posible consultar las órdenes.',
        backgroundColor: 'error'
      })
    } finally {
      setManualRefreshing(false)
    }
  }, [
    search,
    debouncedSearch,
    refetch,
    sendNotification
  ])

  // --------------------------------------------
  // Selección de períodos
  // --------------------------------------------

  const applyRange = useCallback((
    next: DateRangeValue,
    nextPreset: OrdersPreset
  ) => {
    if (next.fromDate.getTime() > next.toDate.getTime()) {
      sendNotification({
        title: 'Rango inválido',
        description: 'La fecha inicial no puede ser posterior a la final.',
        backgroundColor: 'warning'
      })
      return
    }

    setRange(next)
    setPreset(nextPreset)
    setOpenDateFilter(false)

    // No llamar refetch aquí:
    // al cambiar range, Apollo consulta de nuevo.
  }, [sendNotification])

  // --------------------------------------------
  // Filtros locales y ordenamiento
  // --------------------------------------------

  const statusCounts = useMemo(() => {
    const result: Record<string, number> = {}

    for (const order of orders) {
      const name = orderStatusName(order, statuses)
      result[name] = (result[name] ?? 0) + 1
    }

    return result
  }, [orders, statuses])

  const visible = useMemo(() => {
    // La búsqueda ya se realiza en SQL por
    // pCodeRef. No aplicarla nuevamente aquí.
    return applyOrderFilters(
      orders,
      statuses,
      '',
      selectedStatuses,
      sort
    )
  }, [
    orders,
    statuses,
    selectedStatuses,
    sort
  ])

  const visibleStatuses = useMemo(() => {
    if (selectedStatuses.length === 0) return statuses

    return statuses.filter(
      status => selectedStatuses.includes(status.name)
    )
  }, [selectedStatuses, statuses])

  const hasFilters =
    Boolean(search.trim()) ||
    selectedStatuses.length > 0 ||
    preset !== 'today'

  const toggleStatus = useCallback((name: string) => {
    setSelectedStatuses(previous => (
      previous.includes(name)
        ? previous.filter(status => status !== name)
        : [...previous, name]
    ))
  }, [])

  const reset = useCallback(() => {
    setSearch('')
    setDebouncedSearch('')
    setSelectedStatuses([])
    setSort('newest')
    setPreset('today')
    setRange(presetRange('today'))

    // Los cambios se agrupan en React y Apollo
    // consulta con las nuevas variables.
  }, [])

  // --------------------------------------------
  // Consultar detalle individual
  // --------------------------------------------

  const fetchSale = useCallback(async (
    code: string
  ): Promise<OrderRecord> => {
    const response: unknown = await handleGetSale(code)

    const result = extractSale(response)

    if (!result.order) {
      throw new Error(
        result.error ?? 'No encontramos la orden solicitada.'
      )
    }

    return result.order
  }, [handleGetSale])

  const openSale = useCallback(async (
    code: string,
    syncUrl = true
  ) => {
    const normalized = code.trim()
    if (!normalized) return

    const sequence = ++detailSequence.current

    setDetail({
      open: true,
      code: normalized,
      loading: true,
      error: null,
      order: null
    })

    if (syncUrl) handleQuery('sale', normalized)

    try {
      const order = await fetchSale(normalized)

      if (sequence !== detailSequence.current) return

      setDetail({
        open: true,
        code: normalized,
        loading: false,
        error: null,
        order
      })
    } catch (error) {
      if (sequence !== detailSequence.current) return

      setDetail({
        open: true,
        code: normalized,
        loading: false,
        error: error instanceof Error
          ? error.message
          : 'Error consultando la orden.',
        order: null
      })
    }
  }, [handleQuery, fetchSale])

  const closeSale = useCallback(() => {
    ++detailSequence.current

    setDetail(previous => ({
      ...previous,
      open: false
    }))

    handleQuery('sale', '')
  }, [handleQuery])

  // --------------------------------------------
  // Deep link de órdenes
  // --------------------------------------------

  useEffect(() => {
    const getRouteCode = () => (
      typeof routeCodeParam === 'string'
        ? routeCodeParam
        : routeCodeParam &&
          typeof routeCodeParam === 'object' &&
          'CODE' in routeCodeParam
          ? String(routeCodeParam.CODE)
          : null
    )

    const readCode = () => (
      new URLSearchParams(window.location.search)
        .get('sale') || getRouteCode()
    )

    if (!didInitDeepLink.current) {
      didInitDeepLink.current = true

      const code = readCode()
      if (code) void openSale(code, false)
    }

    const syncFromHistory = () => {
      const code = readCode()

      if (code) {
        void openSale(code, false)
      } else {
        ++detailSequence.current

        setDetail(previous => ({
          ...previous,
          open: false
        }))
      }
    }

    window.addEventListener('popstate', syncFromHistory)

    return () => {
      window.removeEventListener('popstate', syncFromHistory)
    }
  }, [openSale, routeCodeParam])

  // --------------------------------------------
  // Impresión
  // --------------------------------------------

  const printOrder = useCallback(async (code: string) => {
    try {
      const response = await handlePrintSale(code)

      if (!response?.success) {
        throw new Error(
          response?.message ||
          'No se pudo enviar la orden a la impresora.'
        )
      }

      sendNotification({
        title: 'Impresión enviada',
        description: response.message ||
          `Orden ${code} enviada a imprimir.`,
        backgroundColor: 'success'
      })
    } catch (error) {
      sendNotification({
        title: 'Error al imprimir',
        description: error instanceof Error
          ? error.message
          : 'No se pudo imprimir la orden.',
        backgroundColor: 'error'
      })
    }
  }, [handlePrintSale, sendNotification])

  // --------------------------------------------
  // Descargar comprobante PDF
  // --------------------------------------------

  const downloadPdf = useCallback(async (code: string) => {
    if (downloadingCode) return

    setDownloadingCode(code)

    try {
      const order = detail.order?.pCodeRef === code
        ? detail.order
        : await fetchSale(code)

      await exportOrderPdf(order)

      sendNotification({
        title: 'PDF generado',
        description: `Comprobante de ${code} disponible para descargar.`,
        backgroundColor: 'success'
      })
    } catch (error) {
      sendNotification({
        title: 'No se pudo generar el PDF',
        description: error instanceof Error
          ? error.message
          : 'Intenta nuevamente.',
        backgroundColor: 'error'
      })
    } finally {
      setDownloadingCode(null)
    }
  }, [
    detail.order,
    downloadingCode,
    fetchSale,
    sendNotification
  ])

  // --------------------------------------------
  // Renderizado
  // --------------------------------------------

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.intro}>
          <div className={styles.introText}>
            <Text
              as='p'
              className={styles.breadcrumb}
              customSize='0.72rem'
              color='gray-dark'
            >
              Operación <span aria-hidden='true'>/</span> Pedidos
            </Text>

            <div className={styles.heading}>
              <div className={styles.headingIcon}>
                <Icon
                  icon='IconShopping'
                  size={25}
                  color='currentColor'
                />
              </div>

              <div>
                <Text
                  as='h1'
                  customSize='1.7rem'
                  weight={700}
                >
                  Gestión de órdenes
                </Text>

                <Text
                  as='p'
                  customSize='0.82rem'
                  color='gray-dark'
                >
                  Controla tus órdenes, revisa sus estados y
                  consulta cada venta en un solo lugar.
                </Text>
              </div>
            </div>
          </div>

          <div className={styles.liveHint}>
            <span className={styles.liveDot} />
            {refreshing
              ? 'Actualizando órdenes…'
              : 'Consulta bajo demanda'}
          </div>
        </header>

        <div className={styles.rangeCaption}>
          <Icon
            icon='IconCalendar'
            size={15}
            color='currentColor'
          />

          <Text
            as='span'
            color='gray-dark'
            customSize='0.72rem'
          >
            Período: {formatOrderDate(range.fromDate.toISOString())}
            {' — '}
            {formatOrderDate(range.toDate.toISOString())}
          </Text>
        </div>

        <OrdersSummary
          orders={visible}
          statuses={statuses}
        />

        <OrdersToolbar
          search={search}
          onSearch={setSearch}
          layout={layout}
          onLayout={setLayout}
          sort={sort}
          onSort={setSort}
          preset={preset}
          onPreset={value => {
            applyRange(presetRange(value), value)
          }}
          onOpenDateFilter={() => setOpenDateFilter(true)}
          selectedStatuses={selectedStatuses}
          onStatusToggle={toggleStatus}
          onClearStatuses={() => setSelectedStatuses([])}
          statuses={statuses}
          counts={statusCounts}
          onRefresh={() => {
            void refresh()
          }}
          refreshing={refreshing}
          onManageStatuses={() => setOpenManageStatuses(true)}
        />

        <div className={styles.contentHeading}>
          <div>
            <Text
              as='h2'
              customSize='0.95rem'
              weight={700}
            >
              {layout === 'columns'
                ? 'Tablero de órdenes'
                : 'Listado de órdenes'}
            </Text>

            <Text
              as='p'
              color='gray-dark'
              customSize='0.74rem'
            >
              {visible.length}{' '}
              {visible.length === 1
                ? 'orden encontrada'
                : 'órdenes encontradas'}
              {' · '}
              {layout === 'columns'
                ? 'Organizadas por estado'
                : 'Información y acciones rápidas'}
            </Text>
          </div>

          {layout === 'columns' && (
            <div className={styles.scrollTip}>
              <Icon
                icon='IconArrowRight'
                size={15}
                color='currentColor'
              />
              <Text as='span' customSize='0.7rem'>
                Desplaza horizontalmente para ver todos los estados
              </Text>
            </div>
          )}
        </div>

        {initialLoading ? (
          <OrdersSkeleton layout={layout} />
        ) : listError ? (
          <OrdersError
            message={listError}
            onRetry={() => {
              void refresh()
            }}
          />
        ) : visible.length === 0 && layout === 'list' ? (
          <OrdersEmpty
            filtered={hasFilters}
            onReset={reset}
          />
        ) : (
          <div
            className={styles.content}
            aria-busy={refreshing}
          >
            {layout === 'columns' ? (
              <DragOrders
                orders={visible}
                statusTypes={visibleStatuses}
                onOpen={code => {
                  void openSale(code)
                }}
                onPrint={code => {
                  void printOrder(code)
                }}
                onPdf={code => {
                  void downloadPdf(code)
                }}
                downloadingCode={downloadingCode}
              />
            ) : (
              <ListOrders
                orders={visible}
                statusTypes={statuses}
                onOpen={code => {
                  void openSale(code)
                }}
                onPrint={code => {
                  void printOrder(code)
                }}
                onPdf={code => {
                  void downloadPdf(code)
                }}
                downloadingCode={downloadingCode}
              />
            )}
          </div>
        )}

        <div className={styles.footnote}>
          <Icon
            icon='IconInfo'
            size={16}
            color='currentColor'
          />

          <Text as='p' customSize='0.72rem'>
            El tablero muestra los estados configurados.
            Cambiar una orden de estado requerirá conectar
            una mutación autorizada del backend.
          </Text>
        </div>
      </div>

      <ModalQueries
        open={openDateFilter}
        range={range}
        onClose={() => setOpenDateFilter(false)}
        onApply={value => applyRange(value, 'custom')}
      />

      <ModalOrder
        state={detail}
        statuses={statuses}
        onClose={closeSale}
        onRetry={() => {
          void openSale(detail.code, false)
        }}
        onPrint={code => {
          void printOrder(code)
        }}
        onPdf={code => {
          void downloadPdf(code)
        }}
        downloading={downloadingCode === detail.code}
      />

      <ModalStatusTypes
        openModalStatusTypes={openManageStatuses}
        setOpenModalStatusTypes={() => setOpenManageStatuses(false)}
      />
    </main>
  )
}
