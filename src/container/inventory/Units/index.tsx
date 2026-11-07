'use client'

import { useQuery } from '@apollo/client'
import { useRouter } from 'next/navigation'
import {
  Button,
  Column,
  getGlobalStyle,
  Icon,
  Loading,
  numberFormat,
  Pagination,
  Section,
  Table,
  TableCell,
  type TableTitleColumn,
  Text
} from 'pkg-components'
import { useState } from 'react'

import { GET_MANAGED_UNITS_IN_STOCK } from './queries'
import styles from './styles.module.css'

/** Cantidad de filas por página. Debe coincidir con el `pageSize` del backend. */
const PAGE_SIZE = 50

type InventoryKind = 'PRODUCT' | 'EXTRA'

/** Fila ya normalizada por el backend (query `getManagedUnitsInStock`). */
interface InventoryUnitRow {
  id: string
  kind: InventoryKind
  name: string
  stock: number
  price: number
  active: boolean
}

interface PaginationMeta {
  totalRecords?: number
  totalPages?: number
  currentPage?: number
}

const UNIT_COLUMNS = [
  {
    id: 'index',
    name: '#',
    key: '',
    justify: 'flex-start' as const,
    width: '70px',
    minWidth: 60,
    maxWidth: 90
  },
  {
    id: 'kind',
    name: 'Tipo',
    key: 'kind',
    justify: 'flex-start' as const,
    width: '150px',
    minWidth: 130,
    maxWidth: 200
  },
  {
    id: 'name',
    name: 'Nombre',
    key: 'name',
    justify: 'flex-start' as const,
    width: '1.4fr',
    minWidth: 180,
    maxWidth: 480,
    sortable: true
  },
  {
    id: 'stock',
    name: 'Unidades en stock',
    key: 'stock',
    justify: 'flex-end' as const,
    width: '180px',
    minWidth: 150,
    maxWidth: 240,
    sortable: true
  },
  {
    id: 'price',
    name: 'Precio',
    key: 'price',
    justify: 'flex-end' as const,
    width: '160px',
    minWidth: 140,
    maxWidth: 220,
    sortable: true
  },
  {
    id: 'active',
    name: 'Estado',
    key: 'active',
    justify: 'center' as const,
    width: '120px',
    minWidth: 110,
    maxWidth: 160
  },
  {
    id: 'actions',
    name: 'Acciones',
    key: '',
    justify: 'center' as const,
    width: '100px',
    minWidth: 90,
    maxWidth: 120
  }
]

export const InventoryUnits = () => {
  const router = useRouter()

  // La paginación la resuelve el backend: solo se mantiene la página activa y
  // se vuelve a consultar con ese `page`. `cache-and-network` da feedback
  // inmediato desde caché mientras llega la página fresca.
  const [page, setPage] = useState(1)

  const { data, loading } = useQuery(GET_MANAGED_UNITS_IN_STOCK, {
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    variables: { page, pageSize: PAGE_SIZE }
  })

  const rows: InventoryUnitRow[] = data?.getManagedUnitsInStock?.data ?? []
  const pagination: PaginationMeta = data?.getManagedUnitsInStock?.pagination ?? {}

  const totalRecords = Number(pagination.totalRecords ?? 0)
  const totalPages = Math.max(1, Number(pagination.totalPages ?? 1))
  const currentPage = Number(pagination.currentPage ?? page)

  // Offset del primer elemento de la página para numeración (#) continua.
  const indexFirstElem = (currentPage - 1) * PAGE_SIZE

  const handlePageChange = (pageNumber: number) => {
    const safePage = Math.min(Math.max(1, pageNumber), totalPages)
    setPage(safePage)
  }

  const handleEdit = (row: InventoryUnitRow) => {
    if (!row.id) { return }

    if (row.kind === 'PRODUCT') {
      router.push(`/products/edit?pId=${encodeURIComponent(row.id)}`)
    }
  }

  return (
    <div className={styles.parent}>
      <header className={styles.header}>
        <Button
          border='none'
          className={styles.backButton}
          onClick={() => router.back()}
        >
          <Icon
            color={getGlobalStyle('--color-icons-primary')}
            icon='IconArrowLeft'
            size={20}
          />
          <Text size='md' weight={600}>Volver</Text>
        </Button>

        <Column gap='xs'>
          <Text as='h1' size='2xl' weight={700}>
            Unidades en inventario
          </Text>

          <Text as='p' color={getGlobalStyle('--color-text-gray-light')} size='md'>
            Productos y complementos que se manejan por inventario y tienen existencias disponibles.
          </Text>
        </Column>

        <div className={styles.summary}>
          <Icon
            color={getGlobalStyle('--color-icons-warning')}
            icon='IconInventory'
            size={35}
          />

          <Column gap='xs'>
            <Text color={getGlobalStyle('--color-text-gray-light')} size='sm' weight={600}>
              Total de ítems
            </Text>

            <Text size='xl' weight={700}>
              {numberFormat(totalRecords)}
            </Text>
          </Column>
        </div>
      </header>

      {loading && rows.length === 0
        ? (
          <div className={styles.stateBox}>
            <Loading />
          </div>
          )
        : rows.length === 0
          ? (
            <div className={styles.stateBox}>
              <Icon
                color={getGlobalStyle('--color-icons-gray-light')}
                icon='IconInventory'
                size={32}
              />

              <Text as='p' size='md'>
                No hay productos ni complementos con inventario disponible.
              </Text>
            </div>
            )
          : (
            <div className={styles.tableContainer}>
              <Table
                columnStorageKey='inventory-units-table-v3'
                data={rows}
                enableColumnResize
                enableKeyboardNav
                header
                loading={loading}
                pointer={false}
                titles={UNIT_COLUMNS}
                renderBody={(
                  dataB: InventoryUnitRow[],
                  titles: TableTitleColumn[]
                ) =>
                  dataB.map((row, index) => {
                    const tableRowIndex = indexFirstElem + index
                    const isProduct = row.kind === 'PRODUCT'

                    return (
                      <Section
                        columnWidth={titles}
                        key={`${row.kind}-${row.id || tableRowIndex}`}
                        odd={index % 2 === 1}
                        padding={`${getGlobalStyle('--spacing-lg')} 0px`}
                      >
                        <TableCell col={0} row={tableRowIndex}>
                          <Text>{tableRowIndex + 1}</Text>
                        </TableCell>

                        <TableCell col={1} row={tableRowIndex}>
                          <span
                            className={`${styles.badge} ${
                              isProduct ? styles.badgeProduct : styles.badgeExtra
                            }`}
                          >
                            <Icon
                              color={getGlobalStyle(
                                isProduct
                                  ? '--color-icons-primary'
                                  : '--color-icons-secondary'
                              )}
                              icon={isProduct ? 'IconBox' : 'IconListBullet'}
                              size={16}
                            />

                            <Text size='sm' weight={600}>
                              {isProduct ? 'Producto' : 'Complemento'}
                            </Text>
                          </span>
                        </TableCell>

                        <TableCell col={2} row={tableRowIndex}>
                          <div className={styles.ellipsis} title={row.name}>
                            <Text>{row.name}</Text>
                          </div>
                        </TableCell>

                        <TableCell col={3} row={tableRowIndex}>
                          <Text weight={700}>{numberFormat(row.stock)}</Text>
                        </TableCell>

                        <TableCell col={4} row={tableRowIndex}>
                          <Text>{numberFormat(row.price)}</Text>
                        </TableCell>

                        <TableCell col={5} row={tableRowIndex}>
                          <span
                            className={`${styles.status} ${
                              row.active ? styles.statusActive : styles.statusInactive
                            }`}
                          >
                            {row.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </TableCell>

                        <TableCell col={6} row={tableRowIndex}>
                          {isProduct && (
                            <Button
                              border='none'
                              onClick={() => handleEdit(row)}
                              title='Editar producto'
                            >
                              <Icon
                                color={getGlobalStyle('--color-icons-primary')}
                                icon='IconEdit'
                                size={18}
                              />
                            </Button>
                          )}
                        </TableCell>
                      </Section>
                    )
                  })}
              />

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <Pagination
                    currentPage={currentPage}
                    handleNextPage={() => handlePageChange(currentPage + 1)}
                    handleOnClick={(pageNumber) => handlePageChange(pageNumber)}
                    handlePrevPage={() => handlePageChange(currentPage - 1)}
                    isVisableButtonLeft={currentPage > 1}
                    isVisableButtonRight={currentPage < totalPages}
                    isVisableButtons={totalPages > 1}
                    items={Array.from({ length: totalPages }, (_, index) => index + 1)}
                  />
                </div>
              )}
            </div>
            )}
    </div>
  )
}
