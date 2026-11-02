import { Icon, Text } from 'pkg-components'
import { useState } from 'react'

import type {
 ReportCatalogCategory, ReportDefinition, ReportFormat 
} from './reports.types'
import styles from './styles.module.css'

interface ReportCatalogProps {
  categories: ReportCatalogCategory[]
  isLoading: boolean
  selected: Set<string>
  format: ReportFormat
  onToggle: (reportId: string) => void
  onToggleCategory: (reports: ReportDefinition[], selectAll: boolean) => void
}

/**
 * Determines whether a report supports the currently chosen export format.
 */
const supportsFormat = (report: ReportDefinition, format: ReportFormat): boolean =>
  report.supportedFormats.includes(format)

/**
 * Dynamic, backend-driven report catalog. Renders one collapsible accordion per
 * category, each listing selectable report cards. Disabled reports are shown
 * with their reason (never hidden) so the user understands availability.
 *
 * @param props - Component props.
 * @returns The rendered catalog selector.
 */
export const ReportCatalog: React.FC<ReportCatalogProps> = ({
  categories,
  isLoading,
  selected,
  format,
  onToggle,
  onToggleCategory
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  if (isLoading && categories.length === 0) {
    return <Text size='sm' className={styles.muted}>Cargando catálogo de reportes...</Text>
  }

  return (
    <div className={styles.catalog}>
      {categories.map((group) => {
        const selectable = group.reports.filter((r) => r.enabled && supportsFormat(r, format))
        const selectedCount = group.reports.filter((r) => selected.has(r.id)).length
        const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.id))
        const isOpen = expanded[group.category] ?? group.category === 'SALES'

        return (
          <div key={group.category} className={styles.category}>
            <button
              type='button'
              className={styles.categoryHeader}
              onClick={() => setExpanded((p) => ({ ...p, [group.category]: !isOpen }))}
              aria-expanded={isOpen}
            >
              <Icon icon={isOpen ? 'IconArrowTop' : 'IconArrowBottom'} size={16} />
              <Text size='md' weight='semibold'>{group.label}</Text>
              {selectedCount > 0 && (
                <span className={styles.countPill}>{selectedCount}</span>
              )}
              {selectable.length > 0 && (
                <span
                  className={styles.selectAll}
                  role='button'
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleCategory(selectable, !allSelected)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                      onToggleCategory(selectable, !allSelected)
                    }
                  }}
                >
                  {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
                </span>
              )}
            </button>

            {isOpen && (
              <div className={styles.reportGrid}>
                {group.reports.map((report) => {
                  const disabled = !report.enabled || !supportsFormat(report, format)
                  const isSelected = selected.has(report.id)
                  const reason = !report.enabled
                    ? report.disabledReason
                    : !supportsFormat(report, format)
                      ? `No disponible en formato ${format}.`
                      : undefined

                  return (
                    <label
                      key={report.id}
                      className={`${styles.reportCard} ${isSelected ? styles.reportCardSelected : ''} ${disabled ? styles.reportCardDisabled : ''}`}
                    >
                      <input
                        type='checkbox'
                        className={styles.checkbox}
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => !disabled && onToggle(report.id)}
                      />
                      <div className={styles.reportBody}>
                        <Text size='sm' weight='semibold'>{report.name}</Text>
                        <Text size='xs' className={styles.muted}>{report.description}</Text>
                        {reason && (
                          <Text size='xs' className={styles.warnText}>{reason}</Text>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
