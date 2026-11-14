'use client'

import React from 'react'
import { Icon } from 'pkg-components'

import type { Client, Store } from '../../types/order'
import { formatOrderDate, formatText } from '../helpers/order-format'
import styles from './order-client-info.module.css'

type Props = {
  client?: Client | null
  store?: Store | null
  createdAt?: string | null
}

type DetailProps = {
  icon: string
  label: string
  value?: string | null
  href?: string
}

function Detail({ icon, label, value, href }: DetailProps) {
  const content = formatText(value)
  const canLink = Boolean(href && value?.trim())
  return (
    <div className={styles.detail}>
      <span className={styles.detailIcon} aria-hidden="true">
        <Icon icon={icon} size={19} />
      </span>
      <div className={styles.detailBody}>
        <dt className={styles.label}>{label}</dt>
        <dd className={styles.value}>
          {canLink ? (
            <a href={href} className={styles.link}>{content}</a>
          ) : content}
        </dd>
      </div>
    </div>
  )
}

const OrderClientInfo: React.FC<Props> = ({ client, store, createdAt }) => {
  const headingId = React.useId()
  const fullName = [client?.clientName, client?.clientLastName]
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .join(' ')

  const phone = client?.clientNumber?.trim()
  const email = store?.emailStore?.trim()

  return (
    <section className={styles.container} aria-labelledby={headingId}>
      <div className={styles.sectionHeading}>
        <span className={styles.headingIcon} aria-hidden="true"><Icon icon="IconUser" size={20} /></span>
        <div>
          <h2 id={headingId} className={styles.heading}>Cliente</h2>
          <p className={styles.subtitle}>Información de contacto y entrega</p>
        </div>
      </div>

      <p className={styles.name}>{formatText(fullName, 'Cliente no identificado')}</p>

      <dl className={styles.details}>
        <Detail icon="IconPhone" label="Teléfono" value={phone} href={phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined} />
        <Detail icon="IconLocationMap2" label="Dirección" value={client?.ClientAddress} />
        <Detail icon="IconFingerPrint" label="Documento" value={client?.ccClient} />
        {createdAt && (
          <Detail icon="IconSimpleCalendar" label="Fecha de creación" value={formatOrderDate(createdAt)} />
        )}
      </dl>

      <div className={styles.storeSection}>
        <div className={styles.sectionHeading}>
          <span className={styles.headingIcon} aria-hidden="true"><Icon icon="IconStore" size={20} /></span>
          <div>
            <h3 className={styles.headingSmall}>Comercio</h3>
            <p className={styles.subtitle}>Datos del establecimiento</p>
          </div>
        </div>
        <dl className={styles.details}>
          <Detail icon="IconInfo" label="Descripción" value={store?.description} />
          <Detail icon="IconEmail" label="Correo electrónico" value={email} href={email ? `mailto:${email}` : undefined} />
        </dl>
      </div>
    </section>
  )
}

export default React.memo(OrderClientInfo)
