// components/order-client-info/index.tsx
import React from 'react'

import type { Client, Store } from '../../types/order.ts'
import styles from './order-client-info.module.css'

type Props = {
  client: Client
  store: Store
}

const OrderClientInfo: React.FC<Props> = ({ client, store }) => {
  return (
    <section className={styles.container}>
      <div className={styles.row}>
        <div>
          <div className={styles.label}>
            Información del cliente
          </div>
          <div className={styles.name}>{client?.clientName} {client?.clientLastName}</div>
          {client?.ClientAddress && <div className={styles.address}>{client?.ClientAddress}</div>}
        </div>
        <div className={styles.right}>
          <div className={styles.smallLabel}>Bill date</div>
          <div>{new Date().toLocaleDateString()}</div>
        </div>
      </div>
      <div className={styles.store}>
        <div className={styles.smallLabel}>Store</div>
        <div>{store?.description}</div>
        {store?.emailStore && <div className={styles.email}>{store?.emailStore}</div>}
      </div>
    </section>
  )
}

export default React.memo(OrderClientInfo)
