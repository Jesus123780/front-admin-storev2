
'use client'

import { useProductsFood } from 'npm-pkg-hook'
import { useRouter } from 'next/navigation'
import {
  Button,
  Loading,
  Text
} from 'pkg-components'

import {
  useEffect,
  useMemo,
  useState
} from 'react'

import styles from './styles.module.css'

const PAGE_SIZE = 50

interface ProductFood {
  pId: string
  pName: string
  pCode?: string
  ProBarCode?: string | null
  ProImage?: string | null
  ProPrice?: number | string | null
  pState?: number
  stock?: number | null
  manageStock?: boolean | null
  minStock?: number | null
  maxStock?: number | null
}

type InventoryStatus =
  | 'UNMANAGED'
  | 'UNKNOWN'
  | 'OUT_OF_STOCK'
  | 'LOW_STOCK'
  | 'OVERSTOCK'
  | 'AVAILABLE'

type Filter = 'ALL' | InventoryStatus

const formatNumber = new Intl.NumberFormat('es-CO')

const formatPrice = (value: ProductFood['ProPrice']) => {
  if (value === null || value === undefined) return '—'

  const amount = Number(value)

  if (!Number.isFinite(amount)) return '—'

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount)
}

const toStockNumber = (
  value: number | null | undefined
): number | null => {
  if (value === null || value === undefined) return null

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

const getStockStatus = (
  product: ProductFood
): InventoryStatus => {
  if (product.manageStock === false) {
    return 'UNMANAGED'
  }

  const stock = toStockNumber(product.stock)
  const minimum = toStockNumber(product.minStock)
  const maximum = toStockNumber(product.maxStock)

  if (stock === null || minimum === null) {
    return 'UNKNOWN'
  }

  if (stock === 0) return 'OUT_OF_STOCK'
  if (stock < minimum) return 'LOW_STOCK'

  if (maximum !== null && stock > maximum) {
    return 'OVERSTOCK'
  }

  return 'AVAILABLE'
}

const statusLabels: Record<InventoryStatus, string> = {
  UNMANAGED: 'Sin control',
  UNKNOWN: 'Sin configuración',
  OUT_OF_STOCK: 'Agotado',
  LOW_STOCK: 'Stock bajo',
  OVERSTOCK: 'Sobre el máximo',
  AVAILABLE: 'Disponible'
}

const filterOptions: Array<{
  value: Filter
  label: string
}> = [
  { value: 'ALL', label: 'Todos' },
  { value: 'LOW_STOCK', label: 'Stock bajo' },
  { value: 'OUT_OF_STOCK', label: 'Agotados' },
  { value: 'AVAILABLE', label: 'Disponibles' },
  { value: 'OVERSTOCK', label: 'Excedidos' },
  { value: 'UNMANAGED', label: 'Sin control' },
  { value: 'UNKNOWN', label: 'Sin configurar' }
]

const resolveImage = (image?: string | null) => {
  if (!image) return '/images/placeholder-image.webp'

  if (image.startsWith('/images/')) return image

  return `/api/images/${encodeURIComponent(image)}`
}

interface ProductCardProps {
  product: ProductFood
  onEdit: (pId: string) => void
}

const ProductCard = ({
  product,
  onEdit
}: ProductCardProps) => {
  const status = getStockStatus(product)

  const stock = toStockNumber(product.stock)
  const minimum = toStockNumber(product.minStock)
  const maximum = toStockNumber(product.maxStock)

  const hasScale =
    product.manageStock !== false &&
    stock !== null &&
    minimum !== null &&
    maximum !== null &&
    maximum > 0 &&
    maximum >= minimum

  const percentage = hasScale
    ? Math.max(0, Math.min(100, (stock / maximum) * 100))
    : 0

  return (
    <article className={styles.card}>
      <div className={styles.productInfo}>
        <div className={styles.imageWrapper}>
          <img
            src={resolveImage(product.ProImage)}
            alt={product.pName}
            className={styles.image}
            loading='lazy'
            onError={(event) => {
              const fallback = '/images/placeholder-image.webp'

              if (
                !event.currentTarget.src.endsWith(fallback)
              ) {
                event.currentTarget.src = fallback
              }
            }}
          />
        </div>

        <div className={styles.productDetails}>
          <h3 className={styles.productName}>
            {product.pName}
          </h3>

          <span className={styles.productCode}>
            {product.ProBarCode || product.pCode || 'Sin código'}
          </span>

          <strong className={styles.price}>
            {formatPrice(product.ProPrice)}
          </strong>
        </div>
      </div>

      <div className={styles.stockSection}>
        <div className={styles.stockHeader}>
          <span className={styles.stockTitle}>
            Existencias
          </span>

          <strong className={styles.stockValue}>
            {stock === null
              ? '—'
              : formatNumber.format(stock)}
          </strong>
        </div>

        {hasScale ? (
          <div
            className={styles.track}
            role='meter'
            aria-label={`Existencias de ${product.pName}`}
            aria-valuemin={0}
            aria-valuemax={maximum}
            aria-valuenow={Math.min(stock, maximum)}
            aria-valuetext={`${stock} unidades; máximo recomendado ${maximum}`}
          >
            <div
              className={`${styles.progress} ${styles[status]}`}
              style={{ width: `${percentage}%` }}
            />

            {minimum > 0 && minimum < maximum && (
              <span
                className={styles.minMarker}
                style={{
                  left: `${(minimum / maximum) * 100}%`
                }}
                aria-hidden='true'
              />
            )}
          </div>
        ) : (
          <div className={styles.noScale}>
            {product.manageStock === false
              ? 'Seguimiento desactivado'
              : 'Sin escala máxima configurada'}
          </div>
        )}

        <div className={styles.stockFooter}>
          <span>
            Mín: {minimum ?? '—'}
          </span>

          <span>
            Máx: {maximum ?? 'Sin definir'}
          </span>
        </div>

        <span
          className={`${styles.status} ${styles[status]}`}
        >
          <span className={styles.statusDot} />
          {statusLabels[status]}
        </span>
      </div>

      <div className={styles.actions}>
        <Button
          border='none'
          onClick={() => onEdit(product.pId)}
        >
          Editar producto
        </Button>
      </div>
    </article>
  )
}

export const ListProducts = () => {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('ALL')
  const [limit, setLimit] = useState(PAGE_SIZE)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setLimit(PAGE_SIZE)
  }, [debouncedSearch])

  // Conserva el contrato usado en el módulo Product.
  const [productsFood, { loading }] = useProductsFood({
    search: debouncedSearch.length >= 4
      ? debouncedSearch
      : '',
    gender: [],
    desc: [],
    categories: undefined,
    max: limit,
    min: 0
  })

  console.log({productsFood})

  const products = useMemo<ProductFood[]>(() => {
    if (!Array.isArray(productsFood)) return []

    const ids = new Set<string>()

    return (productsFood as ProductFood[]).filter((product) => {
      if (!product?.pId || ids.has(product.pId)) {
        return false
      }

      ids.add(product.pId)
      return true
    })
  }, [productsFood])

  const filteredProducts = useMemo(() => {
    const term = debouncedSearch.toLocaleLowerCase('es')

    return products.filter((product) => {
      const matchesStatus =
        filter === 'ALL' ||
        getStockStatus(product) === filter

      // Para búsquedas cortas se filtra el conjunto cargado.
      // A partir de 4 caracteres se usa también el backend.
      const matchesSearch =
        !term ||
        debouncedSearch.length >= 4 ||
        [
          product.pName,
          product.pCode,
          product.ProBarCode
        ].some((field) =>
          String(field ?? '')
            .toLocaleLowerCase('es')
            .includes(term)
        )

      return matchesStatus && matchesSearch
    })
  }, [products, filter, debouncedSearch])

  const handleEdit = (pId: string) => {
    router.push(
      `/products/edit?pId=${encodeURIComponent(pId)}`
    )
  }

  const hasMore = products.length >= limit

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Text as='h1' size='2xl' weight={700}>
            Productos
          </Text>

          <Text as='p' size='sm'>
            Consulta las existencias y los niveles
            de inventario de tus productos.
          </Text>
        </div>

        <div className={styles.counter}>
          <span className={styles.counterValue}>
            {formatNumber.format(products.length)}
          </span>
          <span className={styles.counterLabel}>
            Productos cargados
          </span>
        </div>
      </header>

      <section
        className={styles.toolbar}
        aria-label='Filtros de productos'
      >
        <input
          type='search'
          className={styles.search}
          value={search}
          placeholder='Buscar productos o códigos...'
          onChange={(event) => {
            setSearch(event.target.value)
          }}
          aria-label='Buscar productos'
        />

        <select
          className={styles.filter}
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value as Filter)
          }}
          aria-label='Filtrar por estado de inventario'
        >
          {filterOptions.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <div className={styles.results}>
        {filteredProducts.length} productos visibles
        {filter !== 'ALL' && ' en el conjunto cargado'}
      </div>

      {loading && products.length === 0 ? (
        <div className={styles.state}>
          <Loading />
          <Text>Cargando productos...</Text>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className={styles.state}>
          <Text as='h2' weight={600}>
            No se encontraron productos
          </Text>

          <Text>
            Cambia la búsqueda o el filtro seleccionado.
          </Text>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.pId}
              product={product}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className={styles.pagination}>
          <Button
            disabled={loading}
            onClick={() => {
              setLimit((current) => current + PAGE_SIZE)
            }}
          >
            {loading
              ? 'Cargando...'
              : 'Cargar más productos'}
          </Button>
        </div>
      )}
    </main>
  )
}

export default ListProducts
