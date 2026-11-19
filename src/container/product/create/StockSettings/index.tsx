
'use client'

import { StockLevel } from 'pkg-components'
import {
  useEffect,
  useState
} from 'react'

import styles from './styles.module.css'

export interface StockSettingsValue {
  manageStock: boolean
  minStock: number
  maxStock: number | null
}

export interface StockSettingsProps {
  stock: number
  manageStock?: boolean
  minStock?: number
  maxStock?: number | null
  unit?: string
  disabled?: boolean
  className?: string
  onChange: (value: StockSettingsValue) => void
  handleCheckStock: (value: StockSettingsValue) => void
  onValidityChange?: (valid: boolean) => void
}

const formatter = new Intl.NumberFormat('es-CO')

const parseQuantity = (value: string): number | null => {
  const normalized = value.trim()

  if (!/^\d+$/.test(normalized)) { return null }

  const parsed = Number(normalized)

  return Number.isSafeInteger(parsed)
    ? parsed
    : null
}

export const StockSettings = ({
  stock,
  manageStock = true,
  minStock = 0,
  maxStock = null,
  unit = 'unidades',
  disabled = false,
  className = '',
  onChange,
  onValidityChange,
  handleCheckStock
}: StockSettingsProps) => {
  const [enabled, setEnabled] = useState(manageStock)

  const [minInput, setMinInput] = useState(
    String(minStock)
  )

  const [maxInput, setMaxInput] = useState(
    maxStock === null ? '' : String(maxStock)
  )

  const [hasMaximum, setHasMaximum] = useState(
    maxStock !== null
  )

  // Sincronización con valores externos
  useEffect(() => {
    setEnabled(manageStock)
  }, [manageStock])

  useEffect(() => {
    setMinInput(String(minStock))
  }, [minStock])

  useEffect(() => {
    setMaxInput(
      maxStock === null ? '' : String(maxStock)
    )

    setHasMaximum(maxStock !== null)
  }, [maxStock])

  const minimum = parseQuantity(minInput)

  const maximum = hasMaximum
    ? parseQuantity(maxInput)
    : null

  const minError =
    enabled && minimum === null
      ? 'Ingresa un número entero mayor o igual a cero.'
      : null

  const maxError =
    !enabled || !hasMaximum
      ? null
      : maximum === null
        ? 'Ingresa un máximo válido.'
        : minimum !== null && maximum < minimum
          ? 'El máximo no puede ser menor que el mínimo.'
          : null

  const isValid =
    !enabled || (!minError && !maxError)

  useEffect(() => {
    onValidityChange?.(isValid)
  }, [isValid, onValidityChange])

  /**
   * Publica únicamente configuraciones válidas.
   *
   * No modifica stock ni previousStock.
   */
  const publish = (
    nextEnabled: boolean,
    nextMinInput: string,
    nextMaxInput: string,
    nextHasMaximum: boolean
  ) => {
    const nextMinimum = parseQuantity(nextMinInput)

    const nextMaximum = nextHasMaximum
      ? parseQuantity(nextMaxInput)
      : null

    if (nextMinimum === null) { return }

    if (
      nextHasMaximum &&
      (
        nextMaximum === null ||
        nextMaximum < nextMinimum
      )
    ) {
      return
    }

    onChange({
      manageStock: nextEnabled,
      minStock: nextMinimum,
      maxStock: nextMaximum
    })
  }

  const handleManageStock = (checked: boolean) => {
    setEnabled(checked)

    if (!checked) {
      // Preserva la última configuración guardable.
      onChange({
        manageStock: false,
        minStock,
        maxStock
      })

      return
    }

    publish(
      true,
      minInput,
      maxInput,
      hasMaximum
    )
  }

  const handleMinimum = (value: string) => {
    setMinInput(value)

    publish(
      enabled,
      value,
      maxInput,
      hasMaximum
    )
  }

  const handleMaximum = (value: string) => {
    setMaxInput(value)

    publish(
      enabled,
      minInput,
      value,
      hasMaximum
    )
  }

  const handleMaximumToggle = (checked: boolean) => {
    setHasMaximum(checked)

    publish(
      enabled,
      minInput,
      maxInput,
      checked
    )
  }

  const current = Number.isFinite(stock)
    ? Math.max(0, stock)
    : 0

  const status = !enabled
    ? 'Sin seguimiento'
    : !isValid
      ? 'Configuración inválida'
      : current === 0
        ? 'Agotado'
        : minimum !== null && current < minimum
          ? 'Stock bajo'
          : maximum !== null && current > maximum
            ? 'Sobre el máximo'
            : 'Disponible'

  const statusType = !enabled
    ? 'inactive'
    : !isValid
      ? 'inactive'
      : current === 0
        ? 'empty'
        : minimum !== null && current < minimum
          ? 'low'
          : maximum !== null && current > maximum
            ? 'exceeded'
            : 'normal'

  const canShowStockLevel =
    enabled &&
    isValid &&
    minimum !== null &&
    maximum !== null &&
    maximum > 0

  return (
    <section
      className={[
        styles.container,
        !enabled && styles.unmanaged,
        className
      ].filter(Boolean).join(' ')}
      aria-label='Configuración de inventario'
    >
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h3 className={styles.title}>
            Control de inventario
          </h3>

          <p className={styles.description}>
            Configura los niveles de existencias
            recomendados para este producto.
          </p>
        </div>

        <label className={styles.switch}>
          <input
            type='checkbox'
            className={styles.switchInput}
            checked={enabled}
            disabled={disabled}
            onChange={(event) => {
              handleManageStock(event.target.checked)
              handleCheckStock(event.target.checked)
            }}
            aria-label='Controlar inventario'
          />

          <span className={styles.switchTrack} />
        </label>
      </div>

      {enabled && (
        <div className={styles.content}>
          <div className={styles.currentStock}>
            <div className={styles.currentStockInfo}>
              <span className={styles.fieldLabel}>
                Stock actual
              </span>

              <span className={styles.currentStockDescription}>
                Existencias registradas del producto
              </span>
            </div>

            <div className={styles.currentStockValue}>
              <strong>{formatter.format(current)}</strong>
              <span>{unit}</span>
            </div>
          </div>

          <div className={styles.fields}>
            <div className={styles.field}>
              <label
                className={styles.fieldLabel}
                htmlFor='stock-settings-minimum'
              >
                Stock mínimo
              </label>

              <input
                id='stock-settings-minimum'
                type='number'
                inputMode='numeric'
                min={0}
                step={1}
                value={minInput}
                disabled={disabled}
                onChange={(event) => {
                  handleMinimum(event.target.value)
                }}
                aria-invalid={Boolean(minError)}
                aria-describedby={
                  minError
                    ? 'stock-settings-minimum-error'
                    : undefined
                }
                className={[
                  styles.input,
                  minError && styles.inputError
                ].filter(Boolean).join(' ')}
              />

              <span className={styles.helper}>
                Cantidad para alertar sobre stock bajo.
              </span>

              {minError && (
                <span
                  id='stock-settings-minimum-error'
                  className={styles.error}
                  role='alert'
                >
                  {minError}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label
                className={styles.fieldLabel}
                htmlFor='stock-settings-maximum'
              >
                Stock máximo
                <span className={styles.optional}>
                  Opcional
                </span>
              </label>

              <input
                id='stock-settings-maximum'
                type='number'
                inputMode='numeric'
                min={0}
                step={1}
                value={maxInput}
                disabled={disabled || !hasMaximum}
                placeholder='Sin máximo'
                onChange={(event) => {
                  handleMaximum(event.target.value)
                }}
                aria-invalid={Boolean(maxError)}
                aria-describedby={
                  maxError
                    ? 'stock-settings-maximum-error'
                    : undefined
                }
                className={[
                  styles.input,
                  maxError && styles.inputError
                ].filter(Boolean).join(' ')}
              />

              <span className={styles.helper}>
                Cantidad máxima recomendada.
              </span>

              {maxError && (
                <span
                  id='stock-settings-maximum-error'
                  className={styles.error}
                  role='alert'
                >
                  {maxError}
                </span>
              )}
            </div>
          </div>

          <label className={styles.maximumToggle}>
            <input
              type='checkbox'
              checked={hasMaximum}
              disabled={disabled}
              onChange={(event) => {
                handleMaximumToggle(event.target.checked)
              }}
            />

            <span>Definir un máximo recomendado</span>
          </label>

          <div className={styles.preview}>
            <div className={styles.previewHeader}>
              <span className={styles.previewTitle}>
                Vista previa
              </span>

              <span className={styles.previewHint}>
                Nivel de inventario
              </span>
            </div>

            {canShowStockLevel ? (
              <StockLevel
                stock={current}
                minStock={minimum ?? 0}
                maxStock={maximum}
                unit={unit}
                showStatus
              />
            ) : (
              <div className={styles.fallbackPreview}>
                <div className={styles.previewQuantity}>
                  <strong>
                    {formatter.format(current)}
                  </strong>
                  <span>{unit}</span>
                </div>

                <div className={styles.previewDetails}>
                  <span>
                    Mín: {minimum ?? '—'}
                  </span>

                  <span>
                    Máx: {
                      hasMaximum
                        ? maximum ?? '—'
                        : 'Sin configurar'
                    }
                  </span>
                </div>

                <div
                  className={[
                    styles.status,
                    styles[statusType]
                  ].join(' ')}
                  aria-live='polite'
                >
                  <span className={styles.statusDot} />
                  {status}
                </div>

                <p className={styles.previewDescription}>
                  {isValid
                    ? 'La barra porcentual estará disponible cuando configures un máximo mayor que cero.'
                    : 'Corrige los límites para visualizar el nivel de inventario.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!enabled && (
        <p className={styles.disabledMessage}>
          El seguimiento de inventario está desactivado.
          Los límites configurados se conservarán.
        </p>
      )}
    </section>
  )
}

export default StockSettings
