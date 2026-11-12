
'use client'

import { useElectronUpdater } from 'npm-pkg-hook'
import { useEffect, useRef, useState } from 'react'

import styles from './styles.module.css'

type VisibleStatus =
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'

const PREVIEW_KEY = 'venty.updater.preview'

const getPreviewStatus = (
  value: string | null
): VisibleStatus | null => {
  if (value === '1') return 'downloaded'

  if (
    value === 'available' ||
    value === 'downloading' ||
    value === 'downloaded' ||
    value === 'error'
  ) {
    return value
  }

  return null
}

const shouldShow = (
  status: string | undefined
): status is VisibleStatus => {
  return (
    status === 'available' ||
    status === 'downloading' ||
    status === 'downloaded' ||
    status === 'error'
  )
}

const formatMb = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0.0 MB'
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const ElectronUpdateModal = () => {
  const {
    event,
    currentVersion,
    isElectron,
    updateVersion: detectedVersion,
    downloadProgress,
    checkForUpdates,
    installUpdate
  } = useElectronUpdater()

  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const [dismissed, setDismissed] = useState(false)

  const [previewStatus, setPreviewStatus] =
    useState<VisibleStatus | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    try {
      const stored = window.sessionStorage.getItem(
        PREVIEW_KEY
      )

      const preview = getPreviewStatus(stored)

      setPreviewStatus(preview)

      console.info('[Venty Updater] Preview:', preview)
    } catch (error) {
      console.error(
        '[Venty Updater] Error leyendo preview:',
        error
      )
    }
  }, [])

  const isPreview =
    process.env.NODE_ENV === 'development' &&
    previewStatus !== null

  const status = isPreview
    ? previewStatus
    : event?.status

  const updateVersion = isPreview
    ? '1.0.6'
    : detectedVersion

  const isVisibleEvent = shouldShow(status)

  const open =
    isElectron &&
    isVisibleEvent &&
    !dismissed

  useEffect(() => {
    if (
      status === 'downloaded' ||
      status === 'error'
    ) {
      setDismissed(false)
    }
  }, [status])

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const handleDismiss = (): void => {
    setDismissed(true)
  }

  const progressValue = isPreview
    ? 40
    : event?.status === 'downloading'
      ? downloadProgress
      : 0

  const transferredBytes = isPreview
    ? 8_388_608
    : event?.status === 'downloading'
      ? event.transferred
      : 0

  const totalBytes = isPreview
    ? 20_971_520
    : event?.status === 'downloading'
      ? event.total
      : 0

  const errorMessage = isPreview
    ? 'Error simulado. No se realizó ninguna descarga.'
    : event?.status === 'error'
      ? event.message
      : null

  const description = (() => {
    switch (status) {
      case 'available':
        return updateVersion
          ? `Encontramos la versión ${updateVersion}. La descarga comenzará automáticamente.`
          : 'Encontramos una nueva actualización. La descarga comenzará automáticamente.'

      case 'downloading':
        return updateVersion
          ? `Estamos descargando la versión ${updateVersion}. Puedes continuar trabajando.`
          : 'Estamos descargando la actualización. Puedes continuar trabajando.'

      case 'downloaded':
        return `La versión ${updateVersion ?? 'nueva'} está lista para instalarse. Guarda tus cambios antes de reiniciar.`

      case 'error':
        return 'No fue posible completar la actualización. Revisa el detalle e intenta nuevamente.'

      default:
        return ''
    }
  })()

  return (
    <>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="venty-updater-title"
        aria-describedby="venty-updater-description"
        onCancel={(cancelEvent) => {
          cancelEvent.preventDefault()
          handleDismiss()
        }}
      >
        <button
          type="button"
          className={styles.close}
          aria-label="Ocultar actualización"
          onClick={handleDismiss}
        >
          ×
        </button>

        <div
          className={styles.symbol}
          aria-hidden="true"
        >
          {status === 'error'
            ? '!'
            : status === 'downloaded'
              ? '✓'
              : '↓'}
        </div>

        <h2
          id="venty-updater-title"
          className={styles.title}
        >
          {status === 'available' &&
            'Nueva versión disponible'}

          {status === 'downloading' &&
            'Descargando actualización'}

          {status === 'downloaded' &&
            'Actualización lista'}

          {status === 'error' &&
            'No fue posible actualizar'}
        </h2>

        <p
          id="venty-updater-description"
          className={styles.description}
        >
          {description}
        </p>

        {status === 'downloading' && (
          <div className={styles.progressGroup}>
            <div className={styles.between}>
              <span>Descargando</span>
              <strong>{progressValue}%</strong>
            </div>

            <progress
              className={styles.progress}
              max={100}
              value={progressValue}
              aria-label="Progreso de descarga"
            >
              {progressValue}%
            </progress>

            <div className={styles.between}>
              <small>{formatMb(transferredBytes)}</small>
              <small>{formatMb(totalBytes)}</small>
            </div>
          </div>
        )}

        {status === 'available' && (
          <p className={styles.helper}>
            Preparando descarga…
          </p>
        )}

        {status === 'error' && errorMessage && (
          <p
            className={styles.error}
            role="alert"
          >
            {errorMessage}
          </p>
        )}

        <div className={styles.actions}>
          {status === 'downloaded' && (
            <button
              type="button"
              className={styles.primary}
              disabled={isPreview}
              onClick={() => {
                if (!isPreview) {
                  void installUpdate()
                }
              }}
            >
              Reiniciar e instalar
            </button>
          )}

          {status === 'error' && (
            <button
              type="button"
              className={styles.primary}
              disabled={isPreview}
              onClick={() => {
                if (!isPreview) {
                  void checkForUpdates()
                }
              }}
            >
              Reintentar
            </button>
          )}

          <button
            type="button"
            className={styles.secondary}
            onClick={handleDismiss}
          >
            Más tarde
          </button>
        </div>

        {isPreview && (
          <p
            className={styles.previewNotice}
            role="status"
          >
            Modo demostración: no se descargará ni
            instalará ninguna actualización.
          </p>
        )}

        <p className={styles.footer}>
          Venty {currentVersion ? `v${currentVersion}` : ''}
          {' · '}
          Actualizaciones de Windows
        </p>
      </dialog>

      {isElectron && isVisibleEvent && dismissed && (
        <button
          type="button"
          className={styles.reopen}
          onClick={() => setDismissed(false)}
        >
          {status === 'downloaded'
            ? 'Actualización lista · Instalar'
            : 'Ver actualización'}
        </button>
      )}
    </>
  )
}
