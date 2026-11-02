'use client'

import { Icon, Text } from 'pkg-components'
import { useId, useState, type FC } from 'react'

import type {
  ReportCatalogCategory,
  ReportDefinition,
  ReportFormat
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
 * Determines whether a report supports the selected export format.
 *
 * @param report - Report definition to inspect.
 * @param format - Active export format.
 * @returns `true` when the report supports the format.
 */
const supportsFormat = (report: ReportDefinition, format: ReportFormat): boolean =>
  report.supportedFormats.includes(format)

/**
 * Renders catalog placeholders while report definitions are loading.
 *
 * @returns Accessible loading placeholders.
 */
const CatalogSkeleton: FC = () => (
  <div className={styles.catalog} role='status' aria-label='Cargando catálogo de reportes'>
    {[0, 1].map((categoryIndex) => (
      <div key={categoryIndex} className={styles.category} aria-hidden='true'>
        <div className={styles.skeletonHeader} />
        <div className={styles.reportGrid}>
          {[0, 1, 2, 3].map((reportIndex) => (
            <div key={reportIndex} className={styles.skeletonCard} />
          ))}
        </div>
      </div>
    ))}
  </div>
)

/**
 * Backend-driven report catalog with collapsible categories and selectable
 * report cards. Disabled reports remain visible with an explanation.
 *
 * @param props - Catalog data, selection state and callbacks.
 * @returns The report catalog.
 */
export const ReportCatalog: FC<ReportCatalogProps> = ({
  categories,
  isLoading,
  selected,
  format,
  onToggle,
  onToggleCategory
}) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const instanceId = useId()

  if (isLoading && categories.length === 0) {
    return <CatalogSkeleton />
  }

  if (!isLoading && categories.length === 0) {
    return (
      <div className={styles.stateBox}>
        <Text size='sm' weight='semibold'>No hay reportes disponibles</Text>
        <Text size='xs' className={styles.muted}>
          El catálogo no devolvió reportes para este establecimiento.
        </Text>
      </div>
    )
  }

  return (
    <div className={styles.catalog}>
      {isLoading && (
        <div className={styles.catalogUpdating} role='status'>
          <span className={styles.loadingDot} aria-hidden='true' />
          Actualizando catálogo…
        </div>
      )}

      {categories.map((group, index) => {
        const selectable = group.reports.filter((report) => (
          report.enabled && supportsFormat(report, format)
        ))
        const selectedCount = selectable.filter((report) => selected.has(report.id)).length
        const allSelected = selectable.length > 0 && selectedCount === selectable.length
        const isOpen = expanded[group.category] ?? group.category === 'SALES'
        const panelId = `${instanceId}-category-${index}`
        const selectAllLabel = allSelected
          ? `Quitar selección de ${group.label}`
          : `Seleccionar todos los reportes de ${group.label}`

        return (
          <section key={group.category} className={styles.category}>
            <div className={styles.categoryHeader}>
              <button
                type='button'
                className={styles.categoryToggle}
                onClick={() => setExpanded((previous) => ({
                  ...previous,
                  [group.category]: !isOpen
                }))}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span className={styles.categoryChevron} aria-hidden='true'>
                  <Icon icon={isOpen ? 'IconArrowTop' : 'IconArrowBottom'} size={14} />
                </span>
                <span className={styles.categoryHeading}>
                  <Text size='sm' weight='semibold'>{group.label}</Text>
                  {selectedCount > 0 && (
                    <span className={styles.countPill} aria-label={`${selectedCount} seleccionados`}>
                      {selectedCount}
                    </span>
                  )}
                </span>
              </button>

              {selectable.length > 0 && (
                <button
                  type='button'
                  className={styles.selectAll}
                  onClick={() => onToggleCategory(selectable, !allSelected)}
                  aria-label={selectAllLabel}
                  aria-pressed={allSelected}
                >
                  {allSelected ? 'Quitar todos' : 'Seleccionar todos'}
                </button>
              )}
            </div>

            {isOpen && (
              <div
                id={panelId}
                className={styles.reportGrid}
                role='group'
                aria-label={`Reportes de ${group.label}`}
              >
                {group.reports.map((report) => {
                  const disabled = !report.enabled || !supportsFormat(report, format)
                  const isSelected = !disabled && selected.has(report.id)
                  const reason = !report.enabled
                    ? report.disabledReason || 'No disponible actualmente.'
                    : !supportsFormat(report, format)
                      ? `No disponible en formato ${format}.`
                      : undefined
                  const reasonId = `${panelId}-reason-${report.id}`

                  return (
                    <label
                      key={report.id}
                      className={[
                        styles.reportCard,
                        isSelected ? styles.reportCardSelected : '',
                        disabled ? styles.reportCardDisabled : ''
                      ].filter(Boolean).join(' ')}
                    >
                      <input
                        type='checkbox'
                        className={styles.checkbox}
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => onToggle(report.id)}
                        aria-label={`Seleccionar ${report.name}`}
                        aria-describedby={reason ? reasonId : undefined}
                      />
                      <span className={styles.reportBody}>
                        <Text size='sm' weight='semibold'>{report.name}</Text>
                        <Text size='xs' className={styles.muted}>
                          {report.description}
                        </Text>
                        {reason && (
                          <span id={reasonId} className={styles.reasonTag}>
                            {reason}
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

export default ReportCatalog
