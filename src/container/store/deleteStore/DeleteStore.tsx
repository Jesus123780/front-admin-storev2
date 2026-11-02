'use client'

import {
  Cookies,
  useDeleteStore,
  useLogout
} from 'npm-pkg-hook'
import React, {
  useContext,
  useId,
  useState
} from 'react'

import { removeDoubleQuotes } from '../../../../apollo/helpers'
import { Context } from '../../../context/Context'

import styles from './styles.module.css'

/**
 * Props for the DeleteStore content.
 */
interface DeleteStoreProps {
  /**
   * Called after a successful deletion, before the session is closed.
   * Useful for closing the surrounding modal.
   */
  onDeleted?: () => void
  /**
   * Called when the user cancels the flow (e.g. the Cancel button).
   */
  onCancel?: () => void
}

/**
 * Reads and normalizes the current store ID from the restaurant cookie.
 *
 * @returns {string} The normalized store ID, or an empty string if unavailable.
 */
const getCurrentStoreId = (): string => {
  try {
    return (
      removeDoubleQuotes(Cookies.get('restaurant') ?? '')?.trim() ?? ''
    )
  } catch {
    return ''
  }
}

/**
 * Renders the irreversible store deletion workflow content.
 *
 * This component is meant to be rendered inside an `AwesomeModal` controlled
 * by the parent. The user must type the exact store ID before deletion is
 * enabled. On successful deletion, the current session is terminated.
 *
 * @param {DeleteStoreProps} props - Component props.
 * @returns {React.JSX.Element} The store deletion interface.
 */
export const DeleteStore: React.FC<DeleteStoreProps> = ({
  onDeleted = () => {},
  onCancel = () => {}
}) => {
  const { sendNotification } = useContext(Context)
  const { deleteStore, loading } = useDeleteStore()
  const { onClickLogout } = useLogout({})
  const [currentStoreId] = useState<string>(getCurrentStoreId)
  const [confirmText, setConfirmText] = useState<string>('')

  const instanceId = useId()
  const confirmInputId = `${instanceId}-confirm-store`
  const confirmHelpId = `${instanceId}-confirm-help`
  const confirmStatusId = `${instanceId}-confirm-status`

  const normalizedConfirmText = confirmText.trim()
  const hasTypedConfirmation = normalizedConfirmText.length > 0
  const canDelete =
    currentStoreId.length > 0 &&
    normalizedConfirmText === currentStoreId

  const confirmationStatus = !hasTypedConfirmation
    ? ''
    : canDelete
      ? 'El ID coincide. Ya puedes confirmar la eliminación.'
      : 'El ID no coincide con el comercio actual.'

  /**
   * Cancels the flow when no deletion is in progress.
   *
   * @returns {void}
   */
  const handleCancel = (): void => {
    if (loading) {
      return
    }
    setConfirmText('')
    onCancel()
  }

  /**
   * Executes the deletion after validating the confirmation ID.
   *
   * @returns {Promise<void>}
   */
  const handleConfirm = async (): Promise<void> => {
    if (!canDelete || loading) {
      return
    }

    try {
      const result = await deleteStore(currentStoreId)

      if (!result?.success) {
        sendNotification({
          title: 'No se pudo eliminar el comercio',
          description:
            result?.message ||
            'Ocurrió un error al eliminar el comercio. Inténtalo nuevamente.',
          backgroundColor: 'error'
        })
        return
      }

      setConfirmText('')
      onDeleted()

      sendNotification({
        title: 'Comercio eliminado',
        description:
          result.message ||
          `El comercio ${currentStoreId} fue eliminado correctamente. Ya puedes registrarlo nuevamente.`,
        backgroundColor: 'success'
      })

      // The store no longer exists, so the current session must be closed.
      try {
        await onClickLogout({ redirect: true })
      } catch {
        sendNotification({
          title: 'Sesión pendiente de cierre',
          description:
            'El comercio fue eliminado, pero no se pudo cerrar la sesión automáticamente. Cierra sesión manualmente.',
          backgroundColor: 'error'
        })
      }
    } catch (error: unknown) {
      sendNotification({
        title: 'Error al eliminar el comercio',
        description:
          error instanceof Error && error.message.trim()
            ? error.message
            : 'Ocurrió un error inesperado. Inténtalo nuevamente.',
        backgroundColor: 'error'
      })
    }
  }

  return (
    <div className={styles.modalContent}>
      <div
        className={styles.warningPanel}
        role='note'
      >
        <p className={styles.warningTitle}>
          Antes de continuar
        </p>
        <p className={styles.warningDescription}>
          Eliminar el comercio borrará permanentemente sus tablas,
          registros y usuario asociado. Esto incluye productos, ventas,
          inventario y demás información almacenada.
        </p>
        <p className={styles.warningDescription}>
          <strong>
            Esta acción no se puede deshacer.
          </strong>{' '}
          Utilízala únicamente cuando necesites comenzar de nuevo.
        </p>
      </div>

      <div className={styles.modalWarning}>
        <span
          className={styles.modalWarningIcon}
          aria-hidden='true'
        >
          !
        </span>
        <div>
          <p className={styles.modalWarningTitle}>
            Esta acción es irreversible
          </p>
          <p className={styles.modalWarningDescription}>
            Se eliminará el esquema{' '}
            <code className={styles.inlineCode}>
              tenant_{currentStoreId}
            </code>
            , todas sus tablas y registros, el comercio y el usuario
            asociado.
          </p>
        </div>
      </div>

      {!currentStoreId && (
        <p
          className={styles.unavailableMessage}
          role='status'
        >
          No es posible continuar sin un ID válido. Verifica tu sesión
          y vuelve a cargar la página.
        </p>
      )}

      <form
        className={styles.confirmForm}
        onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault()
          void handleConfirm()
        }}
      >
        <div className={styles.confirmInstruction}>
          <label
            htmlFor={confirmInputId}
            className={styles.inputLabel}
          >
            Confirmar eliminación
          </label>
          <p
            id={confirmHelpId}
            className={styles.inputDescription}
          >
            Para continuar, escribe exactamente el ID del comercio:
          </p>
          <code className={styles.expectedId}>
            {currentStoreId}
          </code>
        </div>

        <input
          id={confirmInputId}
          name='confirmStoreId'
          type='text'
          autoComplete='off'
          autoCapitalize='none'
          spellCheck={false}
          autoFocus
          required
          disabled={loading || !currentStoreId}
          value={confirmText}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setConfirmText(event.currentTarget.value)
          }}
          placeholder='Escribe el ID del comercio'
          aria-describedby={`${confirmHelpId} ${confirmStatusId}`}
          aria-invalid={hasTypedConfirmation && !canDelete}
          className={[
            styles.confirmInput,
            canDelete ? styles.confirmInputValid : '',
            hasTypedConfirmation && !canDelete
              ? styles.confirmInputInvalid
              : ''
          ]
            .filter(Boolean)
            .join(' ')}
        />

        <p
          id={confirmStatusId}
          className={[
            styles.confirmStatus,
            canDelete
              ? styles.confirmStatusValid
              : hasTypedConfirmation
                ? styles.confirmStatusInvalid
                : ''
          ]
            .filter(Boolean)
            .join(' ')}
          aria-live='polite'
          aria-atomic='true'
        >
          {confirmationStatus}
        </p>

        <div className={styles.modalActions}>
          <button
            type='button'
            className={styles.cancelButton}
            disabled={loading}
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button
            type='submit'
            className={styles.confirmButton}
            disabled={!canDelete || loading}
          >
            {loading && (
              <span
                className={styles.spinner}
                aria-hidden='true'
              />
            )}
            {loading
              ? 'Eliminando...'
              : 'Eliminar definitivamente'}
          </button>
        </div>

        {loading && (
          <p
            className={styles.loadingMessage}
            role='status'
          >
            Estamos procesando la solicitud. No cierres la ventana.
          </p>
        )}
      </form>
    </div>
  )
}

export default DeleteStore
