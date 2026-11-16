import styles from './styles.module.css'

export interface LoaderProps {
  label?: string
  inline?: boolean
  exiting?: boolean
}

export function Loader({
  label = '',
  inline = false,
  exiting = false
}: LoaderProps) {
  const className = [
    styles.loader,
    inline ? styles.inline : styles.screen,
    exiting ? styles.exiting : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      role='status'
      aria-live='polite'
      aria-atomic='true'
    >
      <div className={styles.content}>
        <div
          className={styles.progress}
          aria-hidden='true'
        >
          <div className={styles.progressTravel}>
            <span className={styles.progressIndicator} />
          </div>
        </div>

        <p
          className={
            label
              ? styles.description
              : styles.srOnly
          }
        >
          {label || 'Cargando...'}
        </p>
      </div>
    </div>
  )
}