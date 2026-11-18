'use client'

import {
 useGetSale, useManageQueryParams, useMoveOrderOnBoard, useOrdersFromStore, useOrderStatusTypes, usePrintSaleTicket 
} from 'npm-pkg-hook'
import { Icon, Text } from 'pkg-components'
import { EOrderQueryParams } from 'pkg-components/stories/organisms/ModalDetailOrder/type'
import React, {
 useCallback, useContext, useEffect, useMemo, useRef, useState 
} from 'react'

import { Context } from '@/context/Context'

import { exportOrderPdf } from '../utils/exportOrderPdf'
import {
 applyOrderFilters, extractOrders, extractSale, formatOrderDate, normalizeStatusTypes, orderStatusName, presetRange 
} from '../utils/orders'
import { DragOrders } from './components/DragOrders'
import { ListOrders } from './components/ListOrders'
import { ModalOrder } from './components/ModalOrder'
import { ModalQueries } from './components/ModalQueries'
import { ModalStatusTypes } from './components/ModalStatusTypes'
import {
 OrdersEmpty, OrdersError, OrdersSkeleton 
} from './components/OrdersStates'
import { OrdersSummary } from './components/OrdersSummary'
import { OrdersToolbar } from './components/OrdersToolbar'
import styles from './styles.module.css'
import type {
 DateRangeValue, OrderDetailsState, OrderRecord, OrdersLayout, OrdersPreset, OrdersSort, 
OrderStatusType
} from './types'

export interface OrdersViewProps { query?: EOrderQueryParams }

const EMPTY_DETAIL: OrderDetailsState = { open: false, code: '', loading: false, error: null, order: null }

/**
 * MVP dashboard for Venty. Board moves persist to boardStatusId (not financial idStatus).
 * Integrations already present in npm-pkg-hook are reused.
 */
export function OrdersView({ query }: OrdersViewProps) {
  const { sendNotification } = useContext(Context)
  const [layout, setLayout] = useState<OrdersLayout>('columns')
  const [sort, setSort] = useState<OrdersSort>('newest')
  const [search, setSearch] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [preset, setPreset] = useState<OrdersPreset>('today')
  const [range, setRange] = useState<DateRangeValue>(() => presetRange('today'))
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [openDateFilter, setOpenDateFilter] = useState(false)
  const [openManageStatuses, setOpenManageStatuses] = useState(false)
  const [detail, setDetail] = useState<OrderDetailsState>(EMPTY_DETAIL)
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null)
  const [movingCode, setMovingCode] = useState<string | null>(null)
  const [lastMovedCode, setLastMovedCode] = useState<string | null>(null)
  const movingRef = useRef<{ code: string; target: OrderStatusType } | null>(null)
  const moveBusyRef = useRef(false)
  const detailSequence = useRef(0)
  const didInitDeepLink = useRef(false)
  const didInitSearch = useRef(false)
  const latestSearch = useRef(search)
  latestSearch.current = search

  const statusQuery = useOrderStatusTypes()
  const statuses = useMemo(() => normalizeStatusTypes(statusQuery.data), [statusQuery.data])
  const { handleQuery, getParams } = useManageQueryParams()
  const routeCodeParam: unknown = query === EOrderQueryParams.CODE
    ? getParams<{ CODE: string }>(EOrderQueryParams.CODE)
    : null
  const { handleGetSale } = useGetSale()
  const [handlePrintSale] = usePrintSaleTicket()
  const { moveOrder } = useMoveOrderOnBoard()

  const receiveOrders = useCallback((payload: unknown) => {
    const list = extractOrders(payload)
    if (list) {
      const pending = movingRef.current
      setOrders(pending
        ? list.map(order => order.pCodeRef === pending.code ? { ...order, boardStatusId: pending.target.idStatus, status: pending.target.name, statusOrder: pending.target } : order)
        : list)
      setListError(null); setInitialLoading(false)
    }
  }, [])

  // Preserve the current hook contract: [result, { refetch }].
  const [, { refetch }] = useOrdersFromStore({
    fromDate: range.fromDate,
    toDate: range.toDate,
    callback: receiveOrders
  })
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  const refresh = useCallback(async (dates: DateRangeValue = range, queryText: string = latestSearch.current) => {
    setRefreshing(true)
    try {
      const result: unknown = await refetchRef.current({
        fromDate: dates.fromDate,
        toDate: dates.toDate,
        search: queryText.trim()
      })
      receiveOrders(result)
      setListError(null)
      setInitialLoading(false)
    } catch {
      setListError('Verifica la conexión e intenta actualizar la búsqueda.')
      setInitialLoading(false)
      sendNotification({ title: 'Error al actualizar', description: 'No fue posible consultar las órdenes.', backgroundColor: 'error' })
    } finally { setRefreshing(false) }
  }, [range, receiveOrders, sendNotification])

  // Local filtering is immediate. The backend query is debounced to prevent a request on every keystroke.
  useEffect(() => {
    if (!didInitSearch.current) { didInitSearch.current = true; return }
    const timer = window.setTimeout(() => { void refresh(range, search) }, 360)
    return () => window.clearTimeout(timer)
    // Only search changes should trigger the debounce: date changes are explicit below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const applyRange = useCallback((next: DateRangeValue, nextPreset: OrdersPreset) => {
    setRange(next)
    setPreset(nextPreset)
    setOpenDateFilter(false)
    void refresh(next)
  }, [refresh])

  const fetchSale = useCallback(async (code: string): Promise<OrderRecord> => {
    const response: unknown = await handleGetSale(code)
    const result = extractSale(response)
    if (!result.order) {throw new Error(result.error ?? 'No encontramos la orden solicitada.')}
    return result.order
  }, [handleGetSale])

  const openSale = useCallback(async (code: string, syncUrl = true) => {
    const normalized = code.trim()
    if (!normalized) {return}
    const sequence = ++detailSequence.current
    setDetail({ open: true, code: normalized, loading: true, error: null, order: null })
    if (syncUrl) {handleQuery('sale', normalized)}
    try {
      const order = await fetchSale(normalized)
      if (sequence !== detailSequence.current) {return}
      setDetail({ open: true, code: normalized, loading: false, error: null, order })
    } catch (error) {
      if (sequence !== detailSequence.current) {return}
      setDetail({ open: true, code: normalized, loading: false, error: error instanceof Error ? error.message : 'Error consultando la orden.', order: null })
    }
  }, [handleQuery, fetchSale])

  const closeSale = useCallback(() => {
    ++detailSequence.current
    setDetail(previous => ({ ...previous, open: false }))
    handleQuery('sale', '')
  }, [handleQuery])

  useEffect(() => {
    if (!didInitDeepLink.current) {
      didInitDeepLink.current = true
      const codeFromRoute = typeof routeCodeParam === 'string'
        ? routeCodeParam
        : routeCodeParam && typeof routeCodeParam === 'object' && 'CODE' in routeCodeParam
          ? String(routeCodeParam.CODE)
          : null
      const code = new URLSearchParams(window.location.search).get('sale') || codeFromRoute
      if (code) {void openSale(code, false)}
    }
    const syncFromHistory = () => {
      const codeFromRoute = typeof routeCodeParam === 'string'
        ? routeCodeParam
        : routeCodeParam && typeof routeCodeParam === 'object' && 'CODE' in routeCodeParam
          ? String(routeCodeParam.CODE)
          : null
      const code = new URLSearchParams(window.location.search).get('sale') || codeFromRoute
      if (code) {void openSale(code, false)}
      else { ++detailSequence.current; setDetail(previous => ({ ...previous, open: false })) }
    }
    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [openSale])

  const printOrder = useCallback(async (code: string) => {
    try {
      const response = await handlePrintSale(code)
      if (!response?.success) {throw new Error(response?.message || 'No se pudo enviar la orden a la impresora.')}
      sendNotification({ title: 'Impresión enviada', description: response.message || `Orden ${code} enviada a imprimir.`, backgroundColor: 'success' })
    } catch (error) {
      sendNotification({ title: 'Error al imprimir', description: error instanceof Error ? error.message : 'No se pudo imprimir la orden.', backgroundColor: 'error' })
    }
  }, [handlePrintSale, sendNotification])

  const downloadPdf = useCallback(async (code: string) => {
    if (downloadingCode) {return}
    setDownloadingCode(code)
    try {
      const order = detail.order?.pCodeRef === code ? detail.order : await fetchSale(code)
      await exportOrderPdf(order)
      sendNotification({ title: 'PDF generado', description: `Comprobante de ${code} disponible para descargar.`, backgroundColor: 'success' })
    } catch (error) {
      sendNotification({ title: 'No se pudo generar el PDF', description: error instanceof Error ? error.message : 'Intenta nuevamente.', backgroundColor: 'error' })
    } finally { setDownloadingCode(null) }
  }, [detail.order, downloadingCode, fetchSale, sendNotification])

  /** Optimistic cross-column move; backend is authoritative and auditable. */
  const moveBoardOrder = useCallback(async (code: string, fromStatusId: string, toStatusId: string) => {
    if (moveBusyRef.current || fromStatusId === toStatusId) {return}
    const original = orders.find(order => order.pCodeRef === code)
    const target = statuses.find(status => status.idStatus === toStatusId)
    const from = statuses.find(status => status.idStatus === fromStatusId)
    if (!original || !from || !target) {return}

    const expected = original.boardStatusId || statuses.find(status => status.name === orderStatusName(original, statuses))?.idStatus
    if (expected !== fromStatusId) {
      sendNotification({ title: 'Tablero desactualizado', description: 'Actualiza el tablero antes de mover esta orden.', backgroundColor: 'error' })
      return
    }

    moveBusyRef.current = true
    movingRef.current = { code, target }
    setMovingCode(code)
    setLastMovedCode(code)
    setOrders(previous => previous.map(order => order.pCodeRef === code
      ? { ...order, boardStatusId: target.idStatus, status: target.name, statusOrder: target }
      : order))

    try {
      const result = await moveOrder({ pCodeRef: code, expectedStatusId: fromStatusId, toStatusId })
      await refresh()
      sendNotification({ title: 'Orden actualizada', description: `${code}: ${from.name} → ${result.data?.toStatusName || target.name}`, backgroundColor: 'success' })
    } catch (error) {
      movingRef.current = null
      setOrders(previous => previous.map(order => order.pCodeRef === code ? original : order))
      sendNotification({ title: 'No fue posible mover la orden', description: error instanceof Error ? error.message : 'Intenta nuevamente.', backgroundColor: 'error' })
      // A conflict requires reading the authoritative status, not just rolling back.
      await refresh().catch(() => undefined)
    } finally {
      movingRef.current = null
      moveBusyRef.current = false
      setMovingCode(null)
    }
  }, [orders, statuses, moveOrder, refresh, sendNotification])

  const statusCounts = useMemo(() => {
    const result: Record<string, number> = {}
    for (const order of orders) {
      const name = orderStatusName(order, statuses)
      result[name] = (result[name] ?? 0) + 1
    }
    return result
  }, [orders, statuses])
  const visible = useMemo(() => applyOrderFilters(orders, statuses, search, selectedStatuses, sort), [orders, statuses, search, selectedStatuses, sort])
  const visibleStatuses = useMemo(() => selectedStatuses.length ? statuses.filter(status => selectedStatuses.includes(status.name)) : statuses, [selectedStatuses, statuses])
  const hasFilters = Boolean(search || selectedStatuses.length || preset !== 'today')

  const reset = useCallback(() => {
    const next = presetRange('today')
    setSearch('')
    setSelectedStatuses([])
    setSort('newest')
    setRange(next)
    setPreset('today')
    void refresh(next, '')
  }, [refresh])

  return <main className={styles.page}>
    <div className={styles.container}>
      <header className={styles.intro}>
        <div className={styles.introText}>
          <div className={styles.heading}><div className={styles.headingIcon}><Icon icon="IconShopping" size={25} color="currentColor" /></div><div><Text as="h1" customSize="1.7rem" weight={700}>Gestión de órdenes</Text><Text as="p" customSize="0.82rem" color="gray-dark">Controla tus órdenes, revisa sus estados y consulta cada venta en un solo lugar.</Text></div></div>
        </div>
        <div className={styles.liveHint}><span className={styles.liveDot} /> {refreshing ? 'Actualizando órdenes…' : 'Consulta bajo demanda'}</div>
      </header>
      <div className={styles.rangeCaption}><Icon icon="IconCalendar" size={15} color="currentColor" /><Text as="span" color="gray-dark" customSize="0.72rem">Período: {formatOrderDate(range.fromDate.toISOString())} — {formatOrderDate(range.toDate.toISOString())}</Text></div>
      <OrdersSummary orders={visible} statuses={statuses} />
      <OrdersToolbar
        search={search} onSearch={setSearch} layout={layout} onLayout={setLayout}
        sort={sort} onSort={setSort} preset={preset}
        onPreset={value => applyRange(presetRange(value), value)} onOpenDateFilter={() => setOpenDateFilter(true)}
        selectedStatuses={selectedStatuses}
        onStatusToggle={name => setSelectedStatuses(previous => previous.includes(name) ? previous.filter(item => item !== name) : [...previous, name])}
        onClearStatuses={() => setSelectedStatuses([])} statuses={statuses} counts={statusCounts}
        onRefresh={() => { void refresh() }} refreshing={refreshing}
        onManageStatuses={() => setOpenManageStatuses(true)}
      />
      <div className={styles.contentHeading}>
        <div><Text as="h2" customSize="0.95rem" weight={700}>{layout === 'columns' ? 'Tablero de órdenes' : 'Listado de órdenes'}</Text><Text as="p" color="gray-dark" customSize="0.74rem">{visible.length} {visible.length === 1 ? 'orden encontrada' : 'órdenes encontradas'} · {layout === 'columns' ? 'Organizadas por estado' : 'Información y acciones rápidas'}</Text></div>
        {layout === 'columns' && <div className={styles.scrollTip}><Icon icon="IconArrowRight" size={15} color="currentColor" /><Text as="span" customSize="0.7rem">Desplaza horizontalmente para ver todos los estados</Text></div>}
      </div>
      {initialLoading ? <OrdersSkeleton layout={layout} />
        : listError ? <OrdersError message={listError} onRetry={() => { void refresh() }} />
          : !visible.length && layout === 'list' ? <OrdersEmpty filtered={hasFilters} onReset={reset} />
            : <div className={styles.content}>
              {layout === 'columns'
                ? <DragOrders orders={visible} statusTypes={visibleStatuses} onOpen={code => { void openSale(code) }} onPrint={code => { void printOrder(code) }} onPdf={code => { void downloadPdf(code) }} onMove={(code, fromId, toId) => { void moveBoardOrder(code, fromId, toId) }} movingCode={movingCode} lastMovedCode={lastMovedCode} downloadingCode={downloadingCode} />
                : <ListOrders orders={visible} statusTypes={statuses} onOpen={code => { void openSale(code) }} onPrint={code => { void printOrder(code) }} onPdf={code => { void downloadPdf(code) }} downloadingCode={downloadingCode} />}
            </div>}
      <div className={styles.footnote}><Icon icon="IconInfo" size={16} color="currentColor" /><Text as="p" customSize="0.72rem">Arrastra una tarjeta para modificar su estado operativo. El pago, la conciliación, el inventario y los reembolsos no se modifican.</Text></div>
    </div>
    <ModalQueries open={openDateFilter} range={range} onClose={() => setOpenDateFilter(false)} onApply={value => applyRange(value, 'custom')} />
    <ModalOrder state={detail} statuses={statuses} onClose={closeSale} onRetry={() => { void openSale(detail.code, false) }} onPrint={code => { void printOrder(code) }} onPdf={code => { void downloadPdf(code) }} downloading={downloadingCode === detail.code} />{console.log({ detail })}
    <ModalStatusTypes open={openManageStatuses} onClose={() => setOpenManageStatuses(false)} />
  </main>
}
