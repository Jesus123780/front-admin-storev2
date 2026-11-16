'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  useStockMovements,
  useTotalAllSales,
  useTotalProductsInStock,
  useTotalProductsSolded,
  useWeeklyStockMovement
} from 'npm-pkg-hook'
import {
  Button,
  Column,
  getGlobalStyle,
  Icon,
  Text
} from 'pkg-components'
import PropTypes from 'prop-types'

import { ReportGrid } from '../../../ReportGrid'
import { StockMovementsChart } from '../StockMovementsChart'
import styles from './styles.module.css'

/* =========================================================
   DATE UTILITIES
========================================================= */

const formatDatePart = (date, options) => {
  return new Intl.DateTimeFormat('es-CO', options).format(date)
}

const getWeekRange = (weekStart) => {
  const startDate = new Date(weekStart)

  if (Number.isNaN(startDate.getTime())) {
    return ''
  }

  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + 6)

  const startDay = formatDatePart(startDate, {
    day: '2-digit'
  })

  const endDay = formatDatePart(endDate, {
    day: '2-digit'
  })

  const startMonth = formatDatePart(startDate, {
    month: 'long'
  })

  const endMonth = formatDatePart(endDate, {
    month: 'long'
  })

  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDay} al ${endDay} ${endMonth}`
  }

  return `${startDay} ${startMonth} al ${endDay} ${endMonth}`
}

/* =========================================================
   PERCENTAGE UTILITIES
========================================================= */

const parsePercentage = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === 'N/A'
  ) {
    return null
  }

  const parsed = typeof value === 'number'
    ? value
    : Number.parseFloat(
      String(value).replace('%', '').trim()
    )

  return Number.isFinite(parsed) ? parsed : null
}

/* =========================================================
   DIAGNOSTIC UTILITIES
========================================================= */

const describeValue = (value) => ({
  type: typeof value,
  constructor: value?.constructor?.name ?? null,
  isArray: Array.isArray(value),
  isNull: value === null,
  isUndefined: value === undefined,
  length: Array.isArray(value) ? value.length : null,
  keys: value !== null && typeof value === 'object'
    ? Object.keys(value)
    : []
})

/**
 * Serializes diagnostic data without losing undefined,
 * non-finite numbers, BigInt or error messages.
 *
 * Repeated references remain intact unless they are circular.
 */
const serializeDiagnostics = (data) => {
  const ancestors = []

  return JSON.stringify(
    data,
    function replacer (key, value) {
      // Avoid exporting common sensitive fields.
      if (
        /authorization|password|token|secret|cookie|credential|apikey|api_key/i.test(key)
      ) {
        return '[REDACTED]'
      }

      if (typeof value === 'undefined') {
        return '__UNDEFINED__'
      }

      if (typeof value === 'bigint') {
        return value.toString()
      }

      if (typeof value === 'function') {
        return '__FUNCTION__'
      }

      if (typeof value === 'symbol') {
        return String(value)
      }

      if (
        typeof value === 'number' &&
        !Number.isFinite(value)
      ) {
        return String(value)
      }

      if (value instanceof Error) {
        return {
          name: value.name,
          message: value.message
        }
      }

      if (value !== null && typeof value === 'object') {
        while (
          ancestors.length > 0 &&
          ancestors[ancestors.length - 1] !== this
        ) {
          ancestors.pop()
        }

        if (ancestors.includes(value)) {
          return '__CIRCULAR_REFERENCE__'
        }

        ancestors.push(value)
      }

      return value
    },
    2
  )
}

/**
 * Extracts useful hook metadata without exporting the
 * Apollo Client instance or internal query observers.
 */
const extractQueryMetadata = (metadata) => {
  if (metadata == null) {
    return metadata
  }

  if (typeof metadata !== 'object') {
    return metadata
  }

  return {
    loading: metadata.loading,
    called: metadata.called,
    networkStatus: metadata.networkStatus,
    error: metadata.error,
    errors: metadata.errors,
    data: metadata.data,
    previousData: metadata.previousData,
    variables: metadata.variables,
    availableKeys: Object.keys(metadata)
  }
}

/**
 * Captures the public response structure of a hook.
 */
const describeHookResponse = (response) => {
  if (Array.isArray(response)) {
    return {
      structure: describeValue(response),
      data: response[0],
      metadata: extractQueryMetadata(response[1]),
      additionalValues: response
        .slice(2)
        .map(describeValue)
    }
  }

  if (response !== null && typeof response === 'object') {
    return {
      structure: describeValue(response),
      values: Object.fromEntries(
        Object.entries(response).filter(([key, value]) => {
          return typeof value !== 'function' &&
            !['client', 'observable', 'observableQuery'].includes(key)
        })
      )
    }
  }

  return {
    structure: describeValue(response),
    value: response
  }
}

/**
 * Generates a local JSON file without external dependencies.
 */
const downloadJsonFile = (data, filename) => {
  const json = serializeDiagnostics(data)

  const blob = new Blob([json], {
    type: 'application/json;charset=utf-8'
  })

  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = filename
  anchor.style.display = 'none'

  document.body.appendChild(anchor)

  try {
    anchor.click()
  } finally {
    anchor.remove()

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 1000)
  }
}

/* =========================================================
   COMPONENT
========================================================= */

export const InventoryPerformance = ({ filter }) => {
  const router = useRouter()

  /* =====================================================
     RAW HOOK RESPONSES
  ====================================================== */

  const stockMovementsResponse = useStockMovements(filter)

  const weeklyStockResponse = useWeeklyStockMovement()

  const productsInStockResponse = useTotalProductsInStock()

  const productsSoldResponse = useTotalProductsSolded()

  const totalSalesResponse = useTotalAllSales()

  /* =====================================================
     EXTRACTED DATA
  ====================================================== */

  const [stocksMovements] = stockMovementsResponse

  const [
    weeklyStockMovement,
    weeklyStockMetadata
  ] = weeklyStockResponse

  const [totalProductsInStock] = productsInStockResponse

  const [totalProductSold] = productsSoldResponse

  const {
    netTotal,
    totalDiscount
  } = totalSalesResponse

  /* =====================================================
     WEEKLY MOVEMENTS
  ====================================================== */

  const weeklyMovements = Array.isArray(weeklyStockMovement)
    ? weeklyStockMovement
    : []

  const visibleWeeklyMovements = weeklyMovements.filter((item) => {
    return item?.weekStart !== null &&
      item?.weekStart !== undefined &&
      !Number.isNaN(new Date(item.weekStart).getTime())
  })

  /* =====================================================
     DOWNLOAD DIAGNOSTICS
  ====================================================== */

  const handleDownloadDiagnostics = useCallback(() => {
    const records = weeklyMovements.map((item, index) => {
      const rawDate = item?.weekStart

      const date = rawDate == null
        ? null
        : new Date(rawDate)

      const validDate = date !== null &&
        !Number.isNaN(date.getTime())

      const rawPercentage = item?.percentageChange

      const parsedPercentage = parsePercentage(rawPercentage)

      const issues = []

      if (item == null) {
        issues.push('NULL_WEEKLY_RECORD')
      }

      if (rawDate === undefined) {
        issues.push('WEEK_START_UNDEFINED')
      }

      if (rawDate === null) {
        issues.push('WEEK_START_NULL')
      }

      if (!validDate) {
        issues.push('INVALID_WEEK_START_DATE')
      }

      if (rawPercentage === undefined) {
        issues.push('PERCENTAGE_CHANGE_UNDEFINED')
      }

      if (parsedPercentage === null) {
        issues.push('PERCENTAGE_NOT_AVAILABLE')
      }

      return {
        index,

        raw: item,

        structure: describeValue(item),

        date: {
          original: rawDate,
          type: typeof rawDate,
          valid: validDate,

          parsed: validDate
            ? date.toISOString()
            : null,

          timestamp: validDate
            ? date.getTime()
            : null,

          formatted: validDate
            ? getWeekRange(rawDate)
            : null
        },

        percentage: {
          original: rawPercentage,
          parsed: parsedPercentage,
          isPositive: parsedPercentage !== null &&
            parsedPercentage > 0,
          isNegative: parsedPercentage !== null &&
            parsedPercentage < 0,
          isNeutral: parsedPercentage === 0
        },

        excludedFromUI: !validDate,

        issues
      }
    })

    const diagnostics = {
      metadata: {
        application: 'Venty',
        component: 'InventoryPerformance',
        diagnosticVersion: '1.0.0',
        environment: process.env.NODE_ENV,
        generatedAt: new Date().toISOString(),
        timestamp: Date.now(),
        locale: 'es-CO',
        currency: 'COP',
        timezone: Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone
      },

      filter: {
        raw: filter,
        structure: describeValue(filter),
        timezone: filter?.timezone
      },

      hooks: {
        useStockMovements: describeHookResponse(
          stockMovementsResponse
        ),

        useWeeklyStockMovement: describeHookResponse(
          weeklyStockResponse
        ),

        useTotalProductsInStock: describeHookResponse(
          productsInStockResponse
        ),

        useTotalProductsSolded: describeHookResponse(
          productsSoldResponse
        ),

        useTotalAllSales: describeHookResponse(
          totalSalesResponse
        )
      },

      raw: {
        stocksMovements,
        weeklyStockMovement,
        totalProductsInStock,
        totalProductSold,
        netTotal,
        totalDiscount
      },

      structures: {
        stocksMovements: describeValue(stocksMovements),

        weeklyStockMovement: describeValue(
          weeklyStockMovement
        ),

        totalProductsInStock: describeValue(
          totalProductsInStock
        ),

        totalProductSold: describeValue(
          totalProductSold
        ),

        netTotal: describeValue(netTotal),

        totalDiscount: describeValue(totalDiscount)
      },

      weeklyDiagnostics: {
        isArray: Array.isArray(weeklyStockMovement),

        loading: weeklyStockMetadata?.loading,

        error: weeklyStockMetadata?.error,

        originalCount: weeklyMovements.length,

        visibleCount: visibleWeeklyMovements.length,

        excludedCount:
          weeklyMovements.length -
          visibleWeeklyMovements.length,

        invalidDatesCount: records.filter(
          record => !record.date.valid
        ).length,

        unavailablePercentageCount: records.filter(
          record => record.percentage.parsed === null
        ).length,

        records,

        visibleWeeklyMovements,

        excludedRecords: records.filter(
          record => record.excludedFromUI
        )
      },

      ui: {
        showEmptyState: visibleWeeklyMovements.length === 0,

        visibleWeeklyCards: visibleWeeklyMovements.length,

        displayedMetrics: {
          netTotal: netTotal ?? 0,
          totalDiscount: totalDiscount ?? 0,
          totalProductsInStock: totalProductsInStock ?? 0,
          totalProductSold: totalProductSold ?? 0
        }
      },

      diagnosticFlags: {
        weeklyResponseUndefined:
          weeklyStockMovement === undefined,

        weeklyResponseNull:
          weeklyStockMovement === null,

        weeklyResponseNotArray:
          !Array.isArray(weeklyStockMovement),

        weeklyResponseEmpty:
          Array.isArray(weeklyStockMovement) &&
          weeklyStockMovement.length === 0,

        allRecordsExcluded:
          weeklyMovements.length > 0 &&
          visibleWeeklyMovements.length === 0,

        hasInvalidDates:
          records.some(record => !record.date.valid),

        hasMissingPercentage:
          records.some(
            record => record.percentage.parsed === null
          ),

        hasQueryError:
          Boolean(weeklyStockMetadata?.error),

        isLoading:
          Boolean(weeklyStockMetadata?.loading)
      }
    }

    downloadJsonFile(
      diagnostics,
      `venty-inventory-diagnostics-${Date.now()}.json`
    )
  }, [
    filter,
    stockMovementsResponse,
    weeklyStockResponse,
    productsInStockResponse,
    productsSoldResponse,
    totalSalesResponse,
    stocksMovements,
    weeklyStockMovement,
    weeklyStockMetadata,
    totalProductsInStock,
    totalProductSold,
    netTotal,
    totalDiscount,
    weeklyMovements,
    visibleWeeklyMovements
  ])

  /* =====================================================
     KEY PERFORMANCE INDICATORS
  ====================================================== */

  const kpis = [
    {
      label: 'Valor total de ventas concluidas',
      value: netTotal ?? 0,
      numberformat: true,
      icon: {
        icon: 'IconUpTrend',
        color: getGlobalStyle('--color-icons-success'),
        size: 28
      }
    },
    {
      label: 'Valor total descuentos aplicados',
      value: totalDiscount ?? 0,
      numberformat: true,
      icon: {
        icon: 'IconPromo',
        color: getGlobalStyle('--color-icons-success'),
        size: 28
      }
    },
    {
      label: 'Unidades en inventario',
      value: totalProductsInStock ?? 0,
      icon: {
        icon: 'IconInventory',
        color: getGlobalStyle('--color-icons-warning'),
        size: 28
      },
      actionIcon: 'IconUpRightArrow',
      onClick: () => router.push('/products/units')
    },
    {
      label: 'Unidades despachadas',
      value: totalProductSold ?? 0,
      icon: {
        icon: 'IconSales',
        color: getGlobalStyle('--color-icons-secondary'),
        size: 28
      }
    }
  ]

  /* =====================================================
     RENDER
  ====================================================== */

  return (
    <section
      aria-label='Rendimiento del inventario'
      className={styles.section}
    >
      <Column
        className={styles.sectionHeader}
        gap='xs'
      >
        <Text
          as='h2'
          className={styles.sectionTitle}
          size='xl'
          weight={700}
        >
          Rendimiento del inventario
        </Text>

        <Text
          as='p'
          className={styles.sectionSubtitle}
          size='md'
        >
          Métricas de stock, entradas y salidas de inventario
        </Text>
      </Column>

      {/* KPI GRID */}

      <div className={styles.kpiGrid}>
        <ReportGrid data={kpis} />
      </div>

      {/* STOCK MOVEMENTS CHART */}

      <StockMovementsChart
        chartData={stocksMovements}
        className={styles.graphics}
        timezone={filter?.timezone}
        title='Entradas y Salidas de Inventario por día'
      />

      {/* WEEKLY STOCK MOVEMENTS */}

      <div
        aria-label='Variación semanal de inventario'
        className={styles.weeklySection}
      >
        <Column
          className={styles.weeklyHeader}
          gap='xs'
        >
          <div className={styles.weeklyHeaderActions}>
            <Text
              as='h3'
              className={styles.weeklyTitle}
              size='lg'
              weight={700}
            >
              Movimiento semanal
            </Text>

            <Button
              type='button'
              onClick={handleDownloadDiagnostics}
            >
              Descargar diagnóstico
            </Button>
          </div>

          <Text
            as='p'
            className={styles.weeklySubtitle}
            size='md'
          >
            Comparativa de salidas de inventario
            respecto a la semana anterior
          </Text>
        </Column>

        {visibleWeeklyMovements.length === 0
          ? (
            <div className={styles.emptyState}>
              <Icon
                color={getGlobalStyle(
                  '--color-icons-gray-light'
                )}
                icon='IconInventory'
                size={32}
              />

              <Text
                as='p'
                className={styles.emptyStateText}
                size='md'
              >
                Aún no hay movimientos semanales para mostrar.
              </Text>
            </div>
          )
          : (
            <div className={styles.weeklyGrid}>
              {visibleWeeklyMovements.map((item) => {
                const percentage = parsePercentage(
                  item.percentageChange
                )

                const isPositive =
                  percentage !== null && percentage > 0

                const isNegative =
                  percentage !== null && percentage < 0

                const isNeutral = percentage === 0

                const weekRange = getWeekRange(item.weekStart)

                return (
                  <Column
                    className={styles.weekCard}
                    gap='sm'
                    key={String(item.weekStart)}
                  >
                    <Text
                      as='p'
                      className={styles.weekRange}
                      size='sm'
                      weight={600}
                    >
                      {weekRange}
                    </Text>

                    {percentage === null
                      ? (
                        <Text
                          as='p'
                          className={styles.percentageNa}
                          size='md'
                          weight={600}
                        >
                          Sin datos
                        </Text>
                      )
                      : (
                        <div
                          aria-label={
                            isPositive
                              ? `Subió ${percentage}%`
                              : isNegative
                                ? `Bajó ${Math.abs(percentage)}%`
                                : 'Sin variación'
                          }
                          className={`
                            ${styles.percentageRow}
                            ${
                              isPositive
                                ? styles.percentagePositive
                                : isNegative
                                  ? styles.percentageNegative
                                  : styles.percentageNeutral
                            }
                          `}
                        >
                          {!isNeutral && (
                            <Icon
                              color={getGlobalStyle(
                                isPositive
                                  ? '--color-icons-success'
                                  : '--color-icons-error'
                              )}
                              icon={
                                isPositive
                                  ? 'IconUpRightArrow'
                                  : 'IconDownRightArrow'
                              }
                              size={20}
                            />
                          )}

                          <Text
                            as='span'
                            size='lg'
                            weight={700}
                          >
                            {isPositive
                              ? `Subió ${percentage}%`
                              : isNegative
                                ? `Bajó ${Math.abs(percentage)}%`
                                : 'Sin variación'}
                          </Text>
                        </div>
                      )}
                  </Column>
                )
              })}
            </div>
          )}
      </div>
    </section>
  )
}

InventoryPerformance.propTypes = {
  filter: PropTypes.object
}