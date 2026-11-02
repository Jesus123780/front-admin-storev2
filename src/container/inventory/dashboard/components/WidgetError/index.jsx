'use client'

import {
 getGlobalStyle, Icon, Text 
} from 'pkg-components'
import PropTypes from 'prop-types'

import styles from './styles.module.css'

/**
 * Compact, human-friendly error state for a single widget. Keeps the rest of
 * the dashboard operational and offers a retry when a refetch is available.
 *
 * @param {object} props - Component props.
 * @param {string} [props.message] - User-facing message (no stack traces).
 * @param {Function} [props.onRetry] - Optional refetch callback.
 * @returns {JSX.Element} The error state.
 */
export const WidgetError = ({
  message = 'No pudimos cargar esta sección. Intenta nuevamente.',
  onRetry
}) => {
  return (
    <div className={styles.box} role='alert'>
      <Icon color={getGlobalStyle('--color-icons-error')} icon='IconError' size={28} />
      <Text as='p' className={styles.text} size='md'>
        {message}
      </Text>
      {typeof onRetry === 'function' && (
        <button className={styles.retry} onClick={() => onRetry()} type='button'>
          <Icon color={getGlobalStyle('--color-icons-gray')} icon='IconReload' size={16} />
          <Text as='span' size='sm' weight={600}>
            Reintentar
          </Text>
        </button>
      )}
    </div>
  )
}

WidgetError.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func
}
