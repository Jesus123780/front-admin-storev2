'use client'

import { Icon, Tag } from 'pkg-components'
import React from 'react'

import styles from './OrderRefundView.module.css'

/** Tipos de la proyección refundSummary que devuelve getOneSalesStore. */
export type RefundCommercialStatus =
  | 'NOT_REFUNDED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'FULLY_REFUNDED'
  | 'REVIEW_REQUIRED'

export interface RefundExtraView {
  catalogId: string
  name: string
  soldQuantity: number
  expectedRestockedQuantity: number
  restockedQuantity: number
  wasRestocked: boolean
  restockVerified: boolean
  currentStock?: number | null
  manageStock?: boolean | null
}

export interface RefundLineView {
  shoppingCartId: string
  soldProductId?: string
  catalogProductId?: string
  productName: string
  soldQuantity: number
  returnedQuantity: number
  reservedQuantity: number
  remainingQuantity: number
  expectedRestockedQuantity: number
  restockedQuantity: number
  wasRestocked: boolean
  restockVerified: boolean
  currentStock?: number | null
  manageStock?: boolean | null
  extras: RefundExtraView[]
}

export interface RefundKardexAmountView {
  key: string
  delta: number
}

export interface RefundKardexAuditView {
  refundId: string
  verified: boolean
  issues: string[]
  expected: RefundKardexAmountView[]
  actual: RefundKardexAmountView[]
}

export interface RefundOrderSummaryView {
  saleId?: string
  saleReference?: string
  commercialStatus: RefundCommercialStatus
  originalGrossMinor?: string | null
  originalMerchandiseMinor: string
  confirmedRefundMinor: string
  pendingRefundMinor: string
  cancelledRefundMinor?: string
  effectiveMerchandiseMinor: string
  confirmedRefundCount?: number
  pendingRefundCount?: number
  cancelledRefundCount?: number
  verified: boolean
  issues: string[]
  kardexVerified: boolean
  stockIssues: string[]
  kardexAudits?: RefundKardexAuditView[]
  lines: RefundLineView[]
}

/** Los campos *Minor son centésimas de COP; no usar Number() para sumar importes. */
export function minorCOP(raw: string | null | undefined): string {
  if (typeof raw !== 'string' || !/^(0|[1-9]\d*)$/.test(raw)) {return '—'}
  const value = BigInt(raw)
  const pesos = (value / 100n).toLocaleString('es-CO')
  const centavos = (value % 100n).toString().padStart(2, '0')
  return `$ ${pesos},${centavos}`
}

function isPositiveMinor(raw: string | null | undefined): boolean {
  return typeof raw === 'string' && /^(0|[1-9]\d*)$/.test(raw) && BigInt(raw) > 0n
}

/** Opcional: desglose financiero detallado, adicional al banner RefundStatus. */
export const RefundFinancialSummary = React.memo(function RefundFinancialSummary({
  summary
}: { summary?: RefundOrderSummaryView | null }) {
  const headingId = React.useId()
  if (!summary || summary.commercialStatus === 'NOT_REFUNDED') {return null}

  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <div className={styles.cardHeading}>
        <div className={styles.headingIcon} aria-hidden="true"><Icon icon="IconWallet" size={20} /></div>
        <div className={styles.headingCopy}>
          <h2 id={headingId} className={styles.title}>Conciliación de la devolución</h2>
          <p className={styles.subtitle}>Importes de mercancía, sin modificar la venta original.</p>
        </div>
        <Tag
          size="sm"
          rounded="full"
          variant="soft"
          color={summary.verified ? 'success' : 'error'}
          backgroundColor={summary.verified ? 'success' : 'error'}
          textTransform="none"
          label={summary.verified ? 'Conciliado' : 'Revisar'}
        />
      </div>

      <dl className={styles.financialRows}>
        <div className={styles.financialRow}>
          <dt>Mercancía original</dt>
          <dd>{minorCOP(summary.originalMerchandiseMinor)}</dd>
        </div>
        <div className={styles.financialRow}>
          <dt>Reembolso confirmado</dt>
          <dd className={styles.subtraction}>− {minorCOP(summary.confirmedRefundMinor)}</dd>
        </div>
        {isPositiveMinor(summary.pendingRefundMinor) && (
          <div className={styles.financialRow}>
            <dt>Pendiente de confirmación</dt>
            <dd>{minorCOP(summary.pendingRefundMinor)}</dd>
          </div>
        )}
        <div className={`${styles.financialRow} ${styles.financialTotal}`}>
          <dt>Neto después de devoluciones</dt>
          <dd>{minorCOP(summary.effectiveMerchandiseMinor)}</dd>
        </div>
      </dl>

      {!summary.verified && (
        <p className={styles.alert} role="alert">
          <Icon icon="IconWarning" size={17} />
          Hay diferencias en la evidencia interna de pagos. Revisa la conciliación antes de utilizar este neto como confirmado.
        </p>
      )}
      <p className={styles.finePrint}>
        El resumen se limita a mercancía; no recalcula automáticamente propinas, entregas ni impuestos.
      </p>
    </section>
  )
})

type StockEvidenceProps = {
  name: string
  sold: number
  expected: number
  actual: number
  current?: number | null
  manageStock?: boolean | null
  verified: boolean
}

const StockEvidence = React.memo(function StockEvidence({
  name, sold, expected, actual, current, manageStock, verified
}: StockEvidenceProps) {
  const noReentry = verified && expected === 0 && actual === 0
  const label = !verified
    ? 'Revisar kardex'
    : noReentry
      ? 'Sin reintegro requerido'
      : 'Reintegro verificado'

  return (
    <div className={styles.stockRow} data-verified={String(verified)}>
      <div className={styles.stockIdentity}>
        <strong className={styles.stockName}>{name}</strong>
        <span className={styles.stockHint}>Cantidad vendida: {sold}</span>
      </div>

      <dl className={styles.stockMetrics}>
        <div><dt>Esperado</dt><dd>{expected}</dd></div>
        <div><dt>Registrado</dt><dd>{actual}</dd></div>
        <div>
          <dt>Stock actual</dt>
          <dd>{manageStock === false ? 'No aplica' : current ?? '—'}</dd>
        </div>
      </dl>

      <Tag
        size="sm"
        rounded="full"
        variant="soft"
        color={verified ? (noReentry ? 'gray' : 'success') : 'error'}
        backgroundColor={verified ? (noReentry ? 'gray-light' : 'success') : 'error'}
        textTransform="none"
        label={label}
      />
    </div>
  )
})

/** Detalle físico: no genera movimientos de inventario, solo los audita. */
export const RefundInventoryDetails = React.memo(function RefundInventoryDetails({
  summary
}: { summary?: RefundOrderSummaryView | null }) {
  const headingId = React.useId()
  if (!summary || summary.commercialStatus === 'NOT_REFUNDED') {return null}

  const returned = summary.lines.reduce((total, line) => total + line.returnedQuantity, 0)
  const sold = summary.lines.reduce((total, line) => total + line.soldQuantity, 0)

  return (
    <section className={styles.card} aria-labelledby={headingId}>
      <div className={styles.cardHeading}>
        <div className={styles.headingIcon} aria-hidden="true"><Icon icon="IconReload" size={20} /></div>
        <div className={styles.headingCopy}>
          <h2 id={headingId} className={styles.title}>Devoluciones e inventario</h2>
          <p className={styles.subtitle}>
            Reintegros del producto original y sus complementos, auditados contra el kardex.
          </p>
        </div>
        <Tag
          size="sm"
          rounded="full"
          variant="soft"
          color={summary.kardexVerified ? 'success' : 'error'}
          backgroundColor={summary.kardexVerified ? 'success' : 'error'}
          textTransform="none"
          label={summary.kardexVerified ? 'Kardex verificado' : 'Revisar kardex'}
        />
      </div>

      <div className={styles.overview}>
        <span>Unidades devueltas</span>
        <strong>{returned} <span className={styles.overviewSecondary}>/ {sold}</span></strong>
      </div>

      {summary.lines.length > 0 ? (
        <div className={styles.products}>
          {summary.lines.map(line => (
            <article className={styles.product} key={line.shoppingCartId}>
              <div className={styles.productHeading}>
                <div>
                  <h3>{line.productName}</h3>
                  <p>
                    Devueltas: <strong>{line.returnedQuantity}</strong> de {line.soldQuantity}
                    {line.reservedQuantity > 0 && ` · Pendientes: ${line.reservedQuantity}`}
                    {' · '}Restantes: {line.remainingQuantity}
                  </p>
                </div>
                <Tag
                  size="sm"
                  rounded="full"
                  variant="soft"
                  color={line.restockVerified ? 'success' : 'warning'}
                  backgroundColor={line.restockVerified ? 'success' : 'warning'}
                  textTransform="none"
                  label={line.restockVerified ? 'Verificado' : 'En revisión'}
                />
              </div>

              <StockEvidence
                name="Producto principal"
                sold={line.soldQuantity}
                expected={line.expectedRestockedQuantity}
                actual={line.restockedQuantity}
                current={line.currentStock}
                manageStock={line.manageStock}
                verified={line.restockVerified}
              />

              {line.extras.length > 0 && (
                <div className={styles.extras}>
                  <p className={styles.extrasLabel}>Complementos</p>
                  {line.extras.map(extra => (
                    <StockEvidence
                      key={extra.catalogId}
                      name={extra.name}
                      sold={extra.soldQuantity}
                      expected={extra.expectedRestockedQuantity}
                      actual={extra.restockedQuantity}
                      current={extra.currentStock}
                      manageStock={extra.manageStock}
                      verified={extra.restockVerified}
                    />
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No hay líneas de inventario disponibles en esta consulta.</p>
      )}

      {!summary.kardexVerified && (
        <div className={styles.alert} role="alert">
          <Icon icon="IconWarning" size={18} />
          <span>Se detectaron diferencias en la auditoría. No hagas ajustes manuales sin revisar el movimiento original.</span>
        </div>
      )}

      {summary.stockIssues.length > 0 && (
        <details className={styles.diagnostics}>
          <summary>Ver incidencias de inventario ({summary.stockIssues.length})</summary>
          <ul>{summary.stockIssues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}</ul>
        </details>
      )}

      <p className={styles.finePrint}>
        “Registrado” representa los movimientos RESTOCK relacionados con la devolución.
        “Stock actual” puede variar por ventas y ajustes posteriores; no es la cantidad devuelta.
      </p>
    </section>
  )
})
