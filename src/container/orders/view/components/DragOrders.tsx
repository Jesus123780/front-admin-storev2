'use client'

import {
  Column,
  getGlobalStyle,
  Icon,
  type KanbanColumn,
  KanbanDnd,
  type KanbanMove
} from 'pkg-components'
import { SwipeableCard } from 'pkg-components/stories/molecules/SwipeableCard'
import { useMemo, useState } from 'react'

// Keep these imports aligned with the local app's actual exports.
import type { OrderRecord, OrderStatusType } from '../../types'
import { orderStatusName } from '../../utils/orders'
import styles from './styles.module.css'
import { OrderCard } from './ViewOrder/OrderCard'

type BoardItem = {
  id: string
  order: OrderRecord
  status?: OrderStatusType
}

export interface DragOrdersProps {
  orders: OrderRecord[]
  statusTypes: OrderStatusType[]
  onOpen: (code: string) => void
  onPrint: (code: string) => void
  onPdf: (code: string) => void
  onMove: (code: string, fromStatusId: string, toStatusId: string) => void
  downloadingCode?: string | null
  movingCode?: string | null
  lastMovedCode?: string | null
}

const PAGE_SIZE = 24
const UNCLASSIFIED_ID = '__unclassified__'

/**
 * Business adapter. Drag physics/renderClone belong to pkg-components.
 * Only cross-column drops persist: changes to the order inside the same
 * column are not saved as a custom sequence.
 */
export function DragOrders({
  orders,
  statusTypes,
  onOpen,
  onPrint,
  onPdf,
  onMove,
  downloadingCode,
  movingCode,
  lastMovedCode
}: DragOrdersProps) {
  const [limits, setLimits] = useState<Record<string, number>>({})

  const columns = useMemo((): KanbanColumn<BoardItem>[] => {
    const statusesById = new Map(statusTypes.map(status => [status.idStatus, status]))
    const statusesByName = new Map(statusTypes.map(status => [status.name, status]))
    const groups = new Map<string, OrderRecord[]>(statusTypes.map(status => [status.idStatus, []]))
    const unclassified: OrderRecord[] = []

    for (const order of orders) {
      const status = (
        order.boardStatusId
          ? statusesById.get(order.boardStatusId)
          : undefined
      ) ?? statusesByName.get(orderStatusName(order, statusTypes))

      if (status) { groups.get(status.idStatus)!.push(order) }
      else { unclassified.push(order) }
    }

    const result: KanbanColumn<BoardItem>[] = statusTypes.map(status => {
      const group = groups.get(status.idStatus) ?? []
      const sorted = lastMovedCode
        ? [...group].sort((a, b) =>
          Number(b.pCodeRef === lastMovedCode) - Number(a.pCodeRef === lastMovedCode))
        : group
      const limit = limits[status.idStatus] ?? PAGE_SIZE

      return {
        id: status.idStatus,
        title: status.name,
        description: status.description,
        color: status.color,
        backgroundColor: status.backgroundColor,
        totalCount: group.length,
        items: sorted.slice(0, limit).map(order => ({
          id: order.pCodeRef,
          order,
          status
        })),
        emptyLabel: 'Sin órdenes en este estado',
        footer: group.length > limit ? (
          <button
            type="button"
            className={styles.more}
            onClick={() => setLimits(previous => ({
              ...previous,
              [status.idStatus]: limit + PAGE_SIZE
            }))}
          >
            Mostrar {Math.min(PAGE_SIZE, group.length - limit)} más
            {' '}({group.length - limit} restantes)
          </button>
        ) : undefined
      }
    })

    if (unclassified.length) {
      result.push({
        id: UNCLASSIFIED_ID,
        title: 'SIN CLASIFICAR',
        items: unclassified.map(order => ({ id: order.pCodeRef, order })),
        dropDisabled: true,
        totalCount: unclassified.length,
        emptyLabel: 'Sin órdenes sin clasificar'
      })
    }

    return result
  }, [orders, statusTypes, limits, lastMovedCode])

  const handleMove = ({
    itemId,
    sourceColumnId,
    targetColumnId
  }: KanbanMove) => {
    if (
      movingCode ||
      sourceColumnId === targetColumnId ||
      sourceColumnId === UNCLASSIFIED_ID ||
      targetColumnId === UNCLASSIFIED_ID
    ) { return }

    onMove(itemId, sourceColumnId, targetColumnId)
  }

  return (
    <div className={styles.root}>
      <div className={styles.hint} role="note">
        <Icon icon="IconDrag" size={16} color="currentColor" />
        Arrastra desde el asa superior hacia otra columna. Los cambios se guardan en el servidor.
      </div>
      <KanbanDnd<BoardItem>
        columns={columns}
        ariaLabel="Tablero de órdenes organizado por estados"
        // Do NOT pass disabled={Boolean(movingCode)} here: movingCode becomes
        // truthy during RBD's drop animation and disables the active droppable.
        // The handler guards concurrent operations without changing drag props.
        isItemDragDisabled={item => !item.status}
        onMove={handleMove}
        renderItem={(item, context) => (
          <SwipeableCard
            swipeDirections="both"
            swipeWidth={110}
            deleteOnKeyboard
            rightActions={
              <Column
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 150,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '8px 0',
                  boxSizing: 'border-box'
                }}
              >
                {/* Eliminar */}
                <button
                  type='button'
                  title='Eliminar producto'
                  onClick={(event) => {
                    event.stopPropagation()

                  }}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: 12,
                    backgroundColor: getGlobalStyle(
                      '--color-primary-red-bg'
                    )
                  }}
                >
                  <Icon
                    icon='IconDelete'
                    color={getGlobalStyle(
                      '--color-icons-primary'
                    )}
                    size={18}
                  />
                </button>

                {/* Comentario */}
                <button
                  type='button'
                  title='Agregar comentario'
                  onClick={(event) => {
                    event.stopPropagation()
                  }}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: 12,
                    backgroundColor: getGlobalStyle(
                      '--color-feedback-success-dark'
                    )
                  }}
                >
                  <Icon
                    icon='IconComment'
                    color={getGlobalStyle(
                      '--color-icons-white'
                    )}
                    size={18}
                  />
                </button>

                {/* Complementos */}
                <button
                  type='button'
                  title='Abrir orden'
                  onClick={(event) => {
                    event.stopPropagation()
                    onOpen(String(item?.order?.pCodeRef))
                  }}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: 12,
                    backgroundColor: getGlobalStyle(
                      '--color-neutral-gray-white'
                    )
                  }}
                >
                  <Icon
                    size={20}
                    icon='IconListBullet'
                  />
                </button>
              </Column>
            }
            motion="snappy"
            animationDuration={450}
            exitDuration={250}
            rotateOnSwipe={2}
            scaleOnSwipe={0.02}
            gradientAnimation
            sticky
            shake
            autoClose
            autoCloseDelay={3000}
            onDelete={() => console.log('Eliminación completa')}
            onFullSwipeRight={() => console.log('Archivado')}
          >
            <OrderCard
              order={item.order}
              status={item.status}
              onOpen={onOpen}
              onPrint={onPrint}
              onPdf={onPdf}
              busyPdf={downloadingCode === item.id}
            />
          </SwipeableCard>

        )}
      />
    </div>
  )
}
