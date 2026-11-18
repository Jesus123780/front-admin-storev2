'use client'

import { Icon, Text } from 'pkg-components'
import styles from './styles.module.css'

export function OrdersSkeleton({ layout }: { layout: 'list' | 'columns' }) {
  return <div className={styles.skeleton} aria-live="polite" role="status" aria-label="Cargando órdenes">
    {Array.from({ length: layout === 'columns' ? 4 : 5 }, (_, i) => <div key={i} className={layout === 'columns' ? styles.skeletonColumn : styles.skeletonRow}>
      <span className={styles.shimmer} />
      {layout === 'columns' && <><span className={styles.shimmer} /><span className={styles.shimmer} /></>}
    </div>)}
    <span className={styles.srOnly}>Cargando órdenes…</span>
  </div>
}

export function OrdersEmpty({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return <section className={styles.empty}>
    <div className={styles.icon}><Icon icon={filtered ? 'IconSearch' : 'IconBoxes'} size={29} color="var(--color-icons-gray)" /></div>
    <Text as="h2" customSize="1.04rem" weight={700}>{filtered ? 'No hay órdenes con estos filtros' : 'Todavía no hay órdenes en este período'}</Text>
    <Text as="p" color="gray-dark" customSize="0.81rem">{filtered ? 'Prueba con otro código, estado o rango de fechas.' : 'Las nuevas órdenes aparecerán aquí cuando el sistema las registre.'}</Text>
    {filtered && <button type="button" onClick={onReset}>Restablecer filtros</button>}
  </section>
}

export function OrdersError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <section className={styles.empty} role="alert">
    <div className={styles.icon}><Icon icon="IconWarning" size={29} color="var(--color-icons-warning)" /></div>
    <Text as="h2" customSize="1.04rem" weight={700}>No pudimos cargar las órdenes</Text>
    <Text as="p" color="gray-dark" customSize="0.8rem">{message}</Text>
    <button type="button" onClick={onRetry}>Volver a intentar</button>
  </section>
}
