
import styles from './styles.module.css'

export interface LoaderProps {
  label?: string
  inline?: boolean
  exiting?: boolean
}

export function Loader({
  label = 'Cargando...',
  inline = false,
  exiting = false
}: LoaderProps) {
  const className = [
    styles.loader,
    inline ? styles.inline : styles.screen,
    exiting ? styles.exiting : ''
  ].filter(Boolean).join(' ')

  return (
    <div
      className={className}
      role='status'
      aria-live='polite'
    >
      <div className={styles.content}>
        <div className={styles.brand} aria-hidden='true'>
          <span className={styles.brandName}>
          </span>
        </div>

        <div className={styles.progress} aria-hidden='true'>
          <span className={styles.progressIndicator} />
        </div>

        <p className={styles.description}>
          {label}
        </p>
      </div>
    </div>
  )
}
