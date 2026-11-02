'use client'

import { useReportCatalog, useReportsExport } from 'npm-pkg-hook'
import {
  ButtonSuccess,
  Column,
  Icon,
  ReportDateRangePicker,
  type ReportDateRangeValue,
  Text
} from 'pkg-components'
import {
  useCallback,
  useContext,
  useMemo,
  useState,
  type FC
} from 'react'

import { Context } from '@/context/Context'

import { toYMD } from './helpers'
import { RecentReportRequests } from './RecentReportRequests'
import { ReportCatalog } from './ReportCatalog'
import type {
  ReportDefinition,
  ReportFormat,
  UseReportCatalogResult,
  UseReportsExportResult
} from './reports.types'
import styles from './styles.module.css'

/**
 * Checks whether a value is a valid JavaScript Date instance.
 *
 * @param value - Date value to validate.
 * @returns `true` when the date contains a valid timestamp.
 */
const isValidDate = (value: Date): boolean =>
  value instanceof Date && Number.isFinite(value.getTime())

/**
 * Clamps an arbitrary progress value to the supported 0-100 range.
 *
 * @param value - Progress value received from the export hook.
 * @returns A finite progress percentage.
 */
const normalizeProgress = (value: number): number =>
  Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0

/**
 * Builds the default period using the current local calendar date.
 *
 * @returns The inclusive last-30-days range.
 */
const createDefaultRange = (): ReportDateRangeValue => {
  const now = new Date()
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startDate = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate() - 29
  )

  return { startDate, endDate, preset: 'last30' }
}

/**
 * Integrated report-export experience for the POS.
 *
 * The component coordinates the catalog, date range, export format, request
 * summary, generation progress and recent history. Data fetching and export
 * business rules remain inside the hooks from `npm-pkg-hook`.
 *
 * @returns The rendered report-export panel.
 */
export const ReportDownloadsPanel: FC = () => {
  const { sendNotification } = useContext(Context)

  const {
    categories = [],
    isLoading: isCatalogLoading,
    error: catalogError,
    refetch: refetchCatalog
  } = useReportCatalog() as UseReportCatalogResult

  const {
    activeJob,
    isSubmitting,
    isProcessing,
    progress,
    recentRequests,
    isLoadingRecent,
    submit,
    downloadReport,
    cancel,
    retry
  } = useReportsExport({
    sendNotification,
    recentLimit: 5,
    autoDownload: true
  }) as UseReportsExportResult

  const [range, setRange] = useState<ReportDateRangeValue>(createDefaultRange)
  const [exportFormat, setExportFormat] = useState<ReportFormat>('XLSX')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const allReports = useMemo<ReportDefinition[]>(
    () => categories.flatMap((category) => category.reports),
    [categories]
  )

  const reportsById = useMemo(
    () => new Map(allReports.map((report) => [report.id, report])),
    [allReports]
  )

  /**
   * Keeps only reports that still exist and support the active format.
   * The original selection is preserved when changing formats, so users can
   * switch back without losing their previous choices.
   */
  const effectiveSelected = useMemo(() => {
    const eligibleIds = new Set<string>()

    for (const reportId of selected) {
      const report = reportsById.get(reportId)
      if (
        report?.enabled === true &&
        report.supportedFormats.includes(exportFormat)
      ) {
        eligibleIds.add(reportId)
      }
    }

    return eligibleIds
  }, [exportFormat, reportsById, selected])

  const rangeError = useMemo(() => {
    if (!isValidDate(range.startDate) || !isValidDate(range.endDate)) {
      return 'Selecciona un periodo con fechas válidas.'
    }

    if (range.endDate.getTime() < range.startDate.getTime()) {
      return 'La fecha final no puede ser anterior a la inicial.'
    }

    return undefined
  }, [range.endDate, range.startDate])

  const canGenerate =
    effectiveSelected.size > 0 &&
    rangeError === undefined &&
    !isSubmitting &&
    !isProcessing

  const categoriesSelected = useMemo(() => {
    const labels = new Set<string>()

    for (const category of categories) {
      if (category.reports.some((report) => effectiveSelected.has(report.id))) {
        labels.add(category.label)
      }
    }

    return Array.from(labels)
  }, [categories, effectiveSelected])

  const handleToggleReport = useCallback((reportId: string): void => {
    const report = reportsById.get(reportId)
    if (
      report == null ||
      !report.enabled ||
      !report.supportedFormats.includes(exportFormat)
    ) {
      return
    }

    setSelected((previous) => {
      const next = new Set(previous)
      if (next.has(reportId)) {
        next.delete(reportId)
      } else {
        next.add(reportId)
      }
      return next
    })
  }, [exportFormat, reportsById])

  const handleToggleCategory = useCallback((
    reports: ReportDefinition[],
    selectAll: boolean
  ): void => {
    const eligibleIds = reports
      .filter((report) => (
        report.enabled && report.supportedFormats.includes(exportFormat)
      ))
      .map((report) => report.id)

    if (eligibleIds.length === 0) return

    setSelected((previous) => {
      const next = new Set(previous)
      for (const reportId of eligibleIds) {
        if (selectAll) {
          next.add(reportId)
        } else {
          next.delete(reportId)
        }
      }
      return next
    })
  }, [exportFormat])

  const handleGenerate = useCallback(async (): Promise<void> => {
    if (!canGenerate) return

    await submit({
      reportIds: Array.from(effectiveSelected),
      format: exportFormat,
      startDate: toYMD(range.startDate),
      endDate: toYMD(range.endDate),
      timezone: 'America/Bogota'
    })
  }, [canGenerate, effectiveSelected, exportFormat, range.endDate, range.startDate, submit])

  const showProgress = Boolean(
    activeJob && (
      activeJob.status === 'PENDING' || activeJob.status === 'PROCESSING'
    )
  )
  const progressValue = normalizeProgress(progress)
  const formattedPeriod = rangeError === undefined
    ? `${toYMD(range.startDate)} → ${toYMD(range.endDate)}`
    : 'Periodo no válido'

  return (
    <Column className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.headerIcon} aria-hidden='true'>
          <Icon icon='IconExcel' size={25} />
        </div>
        <div className={styles.headerText}>
          <Text as='h2' size='2xl' weight='semibold'>Exportar reportes</Text>
          <Text as='p' size='sm' className={styles.muted}>
            Genera reportes de tu operación, inventario, ventas y facturación.
            Elige la información, el periodo y el formato que necesitas.
          </Text>
        </div>
      </header>

      <section className={styles.section} aria-labelledby='report-period-title'>
        <Text
          as='h3'
          id='report-period-title'
          size='md'
          weight='semibold'
          className={styles.sectionTitle}
        >
          Periodo del reporte
        </Text>
        <ReportDateRangePicker
          label=''
          value={range}
          onChange={setRange}
          error={rangeError}
        />
      </section>

      <section className={styles.section} aria-labelledby='report-catalog-title'>
        <div className={styles.sectionHead}>
          <Text
            as='h3'
            id='report-catalog-title'
            size='md'
            weight='semibold'
            className={styles.sectionTitle}
          >
            Selecciona los reportes
          </Text>
          {effectiveSelected.size > 0 && (
            <span className={styles.selectedPill} aria-live='polite'>
              {effectiveSelected.size} {effectiveSelected.size === 1 ? 'seleccionado' : 'seleccionados'}
            </span>
          )}
        </div>

        {catalogError
          ? (
            <div className={styles.stateBox} role='alert'>
              <Text size='sm' weight='semibold'>
                No se pudo cargar el catálogo de reportes.
              </Text>
              <Text size='xs' className={styles.muted}>
                Revisa tu conexión con el servidor e inténtalo nuevamente.
              </Text>
              <button
                type='button'
                className={styles.retryButton}
                onClick={() => { void refetchCatalog() }}
              >
                Reintentar
              </button>
            </div>
          )
          : (
            <ReportCatalog
              categories={categories}
              isLoading={isCatalogLoading}
              selected={selected}
              format={exportFormat}
              onToggle={handleToggleReport}
              onToggleCategory={handleToggleCategory}
            />
          )}
      </section>

      <section className={styles.section} aria-labelledby='report-format-title'>
        <Text
          as='h3'
          id='report-format-title'
          size='md'
          weight='semibold'
          className={styles.sectionTitle}
        >
          Formato de exportación
        </Text>
        <div className={styles.formatRow} role='group' aria-label='Formato de exportación'>
          <button
            type='button'
            aria-pressed={exportFormat === 'XLSX'}
            className={`${styles.formatOption} ${exportFormat === 'XLSX' ? styles.formatActive : ''}`}
            onClick={() => setExportFormat('XLSX')}
          >
            <span className={styles.formatIcon} aria-hidden='true'>
              <Icon icon='IconExcel' size={22} />
            </span>
            <span className={styles.formatMeta}>
              <span className={styles.formatName}>Excel</span>
              <span className={styles.formatExt}>.xlsx · Una hoja por reporte</span>
            </span>
            <span className={styles.formatCheck} aria-hidden='true'>
              <Icon icon='IconMiniCheck' size={14} />
            </span>
          </button>

          <button
            type='button'
            aria-pressed={exportFormat === 'CSV'}
            className={`${styles.formatOption} ${exportFormat === 'CSV' ? styles.formatActive : ''}`}
            onClick={() => setExportFormat('CSV')}
          >
            <span className={styles.formatIcon} aria-hidden='true'>
              <Icon icon='IconDownload' size={22} />
            </span>
            <span className={styles.formatMeta}>
              <span className={styles.formatName}>CSV</span>
              <span className={styles.formatExt}>
                {effectiveSelected.size > 1 ? '.zip · Un CSV por reporte' : '.csv · Texto plano'}
              </span>
            </span>
            <span className={styles.formatCheck} aria-hidden='true'>
              <Icon icon='IconMiniCheck' size={14} />
            </span>
          </button>
        </div>
        {selected.size > effectiveSelected.size && (
          <Text size='xs' className={styles.formatHint}>
            Algunos reportes seleccionados no están disponibles en {exportFormat}.
            Cambiar el formato puede volver a habilitarlos.
          </Text>
        )}
      </section>

      <section className={styles.summary} aria-label='Resumen de la exportación'>
        <div className={styles.summaryHeading}>
          <Text size='sm' weight='semibold'>Resumen de exportación</Text>
          <Text size='xs' className={styles.muted}>Revisa los datos antes de generar</Text>
        </div>
        <div className={styles.summaryInfo}>
          <div className={styles.summaryRow}>
            <Text size='xs' className={styles.summaryLabel}>Reportes</Text>
            <Text size='sm' weight='semibold'>{effectiveSelected.size}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text size='xs' className={styles.summaryLabel}>Categorías</Text>
            <Text size='sm' className={styles.summaryValue}>
              {categoriesSelected.length > 0 ? categoriesSelected.join(', ') : '—'}
            </Text>
          </div>
          <div className={styles.summaryRow}>
            <Text size='xs' className={styles.summaryLabel}>Periodo</Text>
            <Text size='sm' className={styles.summaryValue}>{formattedPeriod}</Text>
          </div>
          <div className={styles.summaryRow}>
            <Text size='xs' className={styles.summaryLabel}>Formato</Text>
            <Text size='sm' weight='semibold'>
              {exportFormat === 'CSV' && effectiveSelected.size > 1 ? 'CSV (ZIP)' : exportFormat}
            </Text>
          </div>
        </div>
        <div className={styles.generateWrap}>
          <ButtonSuccess
            text={isSubmitting ? 'Solicitando reporte…' : 'Generar reporte'}
            onClick={() => { void handleGenerate() }}
            loading={isSubmitting}
            disabled={!canGenerate}
          />
          {effectiveSelected.size === 0 && (
            <Text size='xs' className={styles.hintText}>
              Selecciona al menos un reporte disponible.
            </Text>
          )}
          {rangeError && (
            <Text size='xs' className={styles.hintText}>
              Corrige el periodo para continuar.
            </Text>
          )}
        </div>
      </section>

      {showProgress && activeJob && (
        <section className={styles.progressCard} aria-live='polite' aria-label='Progreso de generación'>
          <div className={styles.progressHead}>
            <span className={styles.spinner} aria-hidden='true' />
            <Text size='sm' weight='semibold'>
              {activeJob.status === 'PENDING' ? 'Reporte en cola' : 'Generando reporte'}
            </Text>
            {activeJob.stage && (
              <Text size='xs' className={styles.muted}>· {activeJob.stage}</Text>
            )}
            <span className={styles.progressPct}>{progressValue}%</span>
          </div>
          <div
            className={styles.progressTrack}
            role='progressbar'
            aria-label='Porcentaje de generación'
            aria-valuenow={progressValue}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.progressBar} style={{ width: `${progressValue}%` }} />
          </div>
          <div className={styles.progressActions}>
            <button
              type='button'
              className={styles.linkButtonMuted}
              onClick={() => { void cancel(activeJob.id) }}
              aria-label='Cancelar generación del reporte actual'
            >
              Cancelar generación
            </button>
          </div>
        </section>
      )}

      <RecentReportRequests
        requests={recentRequests}
        isLoading={isLoadingRecent}
        onDownload={downloadReport}
        onRetry={retry}
        onCancel={cancel}
      />
    </Column>
  )
}

export default ReportDownloadsPanel
