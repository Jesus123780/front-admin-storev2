'use client'

import Link from 'next/link'

import styles from './PaymentSetupNotice.module.css'

export interface PaymentSetupNoticeProps {
  cashEnabled: boolean
  cashKnown: boolean
  sessionOpen: boolean
  policyLoading: boolean
  policyError: boolean
  configured: boolean
  legacy: boolean
  availableCount: number
  unclassifiedCount: number
  issue: string
}

/** Presentation only. Authoritative validation lives in useSales and the backend. */
export function PaymentSetupNotice({
  cashEnabled, cashKnown, sessionOpen, policyLoading,
  policyError, configured, legacy, availableCount,
  unclassifiedCount, issue
}: PaymentSetupNoticeProps) {
  if (!cashEnabled) {return null}
  const waiting = !cashKnown || policyLoading
  const needsAction = !waiting && (
    !sessionOpen || policyError || Boolean(issue) || availableCount === 0
  )

  if (waiting) {
    return <p className={styles.waiting} role='status'>Consultando los medios habilitados para esta caja…</p>
  }

  if (!needsAction) {
    return <p className={styles.ok} role='status'>
      {legacy
        ? 'Esta sesión fue abierta sin selección por turno y mantiene el catálogo financiero vigente.'
        : configured
          ? `Esta caja acepta ${availableCount} medio${availableCount === 1 ? '' : 's'} de pago en el turno actual.`
          : 'Medios de pago disponibles.'}
    </p>
  }

  const message = !sessionOpen
    ? 'Debes abrir una caja y seleccionar qué medios aceptarás durante este turno.'
    : policyError
      ? 'No se pudo consultar la configuración de pagos de esta caja. Actualiza la sesión antes de continuar.'
      : issue || 'La caja aún no tiene medios disponibles para cobrar.'

  return <div className={styles.notice} role='status'>
    <strong>Completa la configuración de cobro</strong>
    <p>{message}</p>
    {unclassifiedCount > 0 && <p>Hay {unclassifiedCount} medios activos sin clasificación financiera. Clasifícalos antes de habilitarlos.</p>}
    <p className={styles.detail}>En Finanzas puedes clasificar los medios; al abrir una caja eliges cuáles se aceptan en ese turno. Solo el efectivo genera entrada física.</p>
    <Link href={!sessionOpen ? '/finance/cash' : '/finance/cash?tab=methods'}>Ir a Finanzas · {sessionOpen ? 'Medios de pago' : 'Abrir caja'} <span aria-hidden='true'>↗</span></Link>
  </div>
}
