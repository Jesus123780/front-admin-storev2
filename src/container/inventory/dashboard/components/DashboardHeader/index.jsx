'use client'

import {
 getGlobalStyle, Icon, Text 
} from 'pkg-components'
import PropTypes from 'prop-types'

import styles from './styles.module.css'

/**
 * Dashboard header: title, welcome message, active-filter chips and a refresh
 * action. Kept presentational so it composes with the real app layout rather
 * than duplicating the global sidebar/header.
 *
 * @param {object} props - Component props.
 * @param {string} [props.title] - Main heading.
 * @param {string} [props.subtitle] - Welcome/secondary message.
 * @param {number} [props.activeFilterCount] - Count of active filters.
 * @param {string} [props.periodLabel] - Readable period label.
 * @param {boolean} [props.refreshing] - Whether a background refresh is running.
 * @param {Function} [props.onClearFilters] - Clear-filters handler.
 * @param {Function} [props.onRefresh] - Refresh handler.
 * @returns {JSX.Element} The header.
 */
export const DashboardHeader = ({
  title = 'Resumen del panel',
  subtitle = 'Bienvenido de nuevo. Este es el rendimiento de tu tienda.',
  activeFilterCount = 0,
  periodLabel = '',
  refreshing = false,
  onClearFilters,
  onRefresh
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <Text as='h1' className={styles.title} size='2xl' weight={700}>
          {title}
        </Text>
        <Text as='p' className={styles.subtitle} size='md'>
          {subtitle}
        </Text>
      </div>

      <div className={styles.actions}>
        {periodLabel && (
          <span className={styles.periodChip}>
            <Icon color={getGlobalStyle('--color-icons-gray')} icon='IconCalendar' size={14} />
            <Text as='span' size='sm'>{periodLabel}</Text>
          </span>
        )}

        {activeFilterCount > 0 && (
          <button className={styles.clearBtn} onClick={() => onClearFilters?.()} type='button'>
            <Icon color={getGlobalStyle('--color-icons-gray')} icon='IconClose' size={14} />
            <Text as='span' size='sm' weight={600}>
              Limpiar filtros ({activeFilterCount})
            </Text>
          </button>
        )}

        <button
          aria-label='Actualizar datos'
          className={styles.refreshBtn}
          disabled={refreshing}
          onClick={() => onRefresh?.()}
          type='button'
        >
          <Icon color={getGlobalStyle('--color-icons-gray')} icon='IconReload' size={16} />
          <Text as='span' size='sm' weight={600}>
            {refreshing ? 'Actualizando…' : 'Actualizar'}
          </Text>
        </button>
      </div>
    </header>
  )
}

DashboardHeader.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  activeFilterCount: PropTypes.number,
  periodLabel: PropTypes.string,
  refreshing: PropTypes.bool,
  onClearFilters: PropTypes.func,
  onRefresh: PropTypes.func
}
