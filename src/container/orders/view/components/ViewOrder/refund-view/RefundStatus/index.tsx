'use client'

import { getGlobalStyle, Icon, Tag } from 'pkg-components'
import React from 'react'

import { minorCOP, RefundOrderSummaryView } from '../OrderRefundView'
import styles from './RefundStatus.module.css'

type CommercialStatus = RefundOrderSummaryView['commercialStatus']
type VisibleStatus = Exclude<CommercialStatus, 'NOT_REFUNDED'>

type StatusPresentation = {
  title: string
  description: string
  label: string
  icon: string
  tagColor: 'success' | 'warning' | 'secondary' | 'error'
  tagBackground: 'success' | 'warning' | 'secondary' | 'error'
}

const STATUS: Record<VisibleStatus, StatusPresentation> = {
  FULLY_REFUNDED: {
    title: 'Venta devuelta totalmente',
    description: 'El importe de la mercancía fue reembolsado en su totalidad.',
    label: 'Devolución total',
    icon: 'IconMiniCheck',
    tagColor: 'success',
    tagBackground: 'success'
  },
  PARTIALLY_REFUNDED: {
    title: 'Venta devuelta parcialmente',
    description: 'Una parte de la mercancía fue reembolsada; queda un saldo de venta.',
    label: 'Devolución parcial',
    icon: 'IconReload',
    tagColor: 'warning',
    tagBackground: 'warning'
  },
  REFUND_PENDING: {
    title: 'Devolución pendiente',
    description: 'Existe una solicitud pendiente de confirmación. Su importe todavía no se descuenta del neto.',
    label: 'Pendiente',
    icon: 'IconWallet',
    tagColor: 'secondary',
    tagBackground: 'secondary'
  },
  REVIEW_REQUIRED: {
    title: 'Devolución en revisión',
    description: 'Hay diferencias en las evidencias de la operación que requieren validación.',
    label: 'Requiere revisión',
    icon: 'IconWarning',
    tagColor: 'error',
    tagBackground: 'error'
  }
}

function readMinor(value: string): bigint | null {
  return /^(0|[1-9]\d*)$/.test(value) ? BigInt(value) : null
}

function refundProgress(originalRaw: string, confirmedRaw: string): number | null {
  const original = readMinor(originalRaw)
  const confirmed = readMinor(confirmedRaw)

  if (original === null || confirmed === null || original <= 0n || confirmed > original) {
    return null
  }

  // BigInt evita pérdida de precisión con importes grandes.
  return Number((confirmed * 1000n) / original) / 10
}

export interface RefundStatusProps {
  summary?: RefundOrderSummaryView | null
  /** Estado histórico de la orden, no el estado de devolución. */
  originalStatus?: string | null
  className?: string
}

export const RefundStatus = React.memo(function RefundStatus({
  summary,
  originalStatus,
  className
}: RefundStatusProps) {
  const headingId = React.useId()

  if (!summary || summary.commercialStatus === 'NOT_REFUNDED') {return null}

  const visual = STATUS[summary.commercialStatus]
  const progress = refundProgress(
    summary.originalMerchandiseMinor,
    summary.confirmedRefundMinor
  )

  const soldUnits = summary.lines.reduce((total, line) => total + line.soldQuantity, 0)
  const returnedUnits = summary.lines.reduce((total, line) => total + line.returnedQuantity, 0)
  const pending = readMinor(summary.pendingRefundMinor)
  const requiresRestock = summary.lines.some(line =>
    line.expectedRestockedQuantity > 0 ||
    line.extras.some(extra => extra.expectedRestockedQuantity > 0)
  )

  const stockLabel = summary.kardexVerified
    ? requiresRestock ? 'Reposición conciliada' : 'Sin reposición requerida'
    : 'Revisar movimientos de stock'

  return (
    <section
      className={[styles.banner, className].filter(Boolean).join(' ')}
      data-state={summary.commercialStatus}
      aria-labelledby={headingId}
    >
      <div className={styles.header}>
        <div className={styles.iconShell} aria-hidden="true">
          <Icon icon={visual.icon} size={23} />
        </div>

        <div className={styles.intro}>
          <div className={styles.eyebrow}>Estado comercial de la venta</div>
          <h2 id={headingId} className={styles.title}>{visual.title}</h2>
          <p className={styles.description}>{visual.description}</p>

          <div className={styles.tags}>
            <Tag
              size="sm"
              rounded="full"
              variant="soft"
              color={visual.tagColor}
              backgroundColor={visual.tagBackground}
              weight="semibold"
              textTransform="none"
              label={visual.label}
            />
            {originalStatus?.trim() && (
              <Tag
                size="sm"
                rounded="full"
                variant="outline"
                color="gray"
                backgroundColor="transparent"
                weight="medium"
                textTransform="none"
                label={`Original: ${originalStatus.trim()}`}
              />
            )}
          </div>
        </div>

        <div className={styles.netAmount}>
          <span className={styles.netLabel}>Neto de mercancía</span>
          <strong className={styles.netValue}>{minorCOP(summary.effectiveMerchandiseMinor)}</strong>
          <span className={styles.netCaption}>Después de devoluciones confirmadas</span>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Venta original</span>
          <strong className={styles.metricValue}>{minorCOP(summary.originalMerchandiseMinor)}</strong>
          <span className={styles.metricCaption}>Mercancía vendida</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Reembolso confirmado</span>
          <strong className={`${styles.metricValue} ${styles.refundedValue}`}>
            − {minorCOP(summary.confirmedRefundMinor)}
          </strong>
          <span className={styles.metricCaption}>Descontado del neto</span>
        </div>

        <div className={styles.metric}>
          <span className={styles.metricLabel}>Unidades devueltas</span>
          <strong className={styles.metricValue}>
            {returnedUnits} <span className={styles.metricDenominator}>/ {soldUnits}</span>
          </strong>
          <span className={styles.metricCaption}>Historial vendido sin modificar</span>
        </div>
      </div>

      {progress !== null && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeading}>
            <span>Importe de mercancía reembolsado</span>
            <strong>{new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(progress)}%</strong>
          </div>
          <div
            className={styles.progressTrack}
            role="progressbar"
            aria-label="Porcentaje del importe de mercancía reembolsado"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {pending !== null && pending > 0n && (
        <div className={styles.pending}>
          <Icon icon="IconWallet" size={17} />
          <span>
            Hay <strong>{minorCOP(summary.pendingRefundMinor)}</strong> pendiente de confirmación.
            No se ha descontado del neto.
          </span>
        </div>
      )}

      <div className={styles.footer}>
        <div className={styles.checks}>
          <span className={styles.check} data-valid={summary.verified ? 'true' : 'false'}>
            <Icon icon={summary.verified ? 'IconMiniCheck' : 'IconWarning'} size={17}  />
            {summary.verified ? 'Pagos conciliados' : 'Revisar evidencia de pagos'}
          </span>
          <span className={styles.check} data-valid={summary.kardexVerified ? 'true' : 'false'}>
            <Icon icon={summary.kardexVerified ? 'IconMiniCheck' : 'IconWarning'} size={17}  />
            {stockLabel}
          </span>
        </div>
        <p className={styles.footnote}>
          La venta original permanece registrada. Los movimientos RESTOCK se
          comprueban contra el kardex; el stock actual puede variar por otras operaciones.
        </p>
      </div>
    </section>
  )
})
