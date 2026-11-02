'use client'

import { useReportCatalog, useReportsExport } from 'npm-pkg-hook'
import {
  ButtonSuccess,
  Column,
  getGlobalStyle,
  Icon,
  ReportDateRangePicker,
  type ReportDateRangeValue,
  Text
} from 'pkg-components'
import {
 useContext, useMemo, useState 
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
 * Builds the default period: the last 30 days, matching the previous "último
 * mes" behavior while letting the user change it.
 */
const defaultRange = (): ReportDateRangeValue => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)
  return {
    startDate: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
    endDate: new Date(end.getFullYear(), end.getMonth(), end.getDate()),
    preset: 'last30'
  }
}

/**
 * The integrated POS report export experience. Composes the dynamic catalog,
 * period selector, format choice, request summary, live generation progress and
 * the recent-requests history. All business logic lives in the
 * `useReportsExport` hook; this component only orchestrates presentation.
 *
 * @returns The rendered export module.
 */
export const ReportDownloadsPanel = () => {
  const { sendNotification } = useContext(Context)

  const { categories, isLoading: isCatalogLoading } = useReportCatalog() as UseReportCatalogResult
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
  } = useReportsExport({ sendNotification, recentLimit: 5, autoDownload: true }) as UseReportsExportResult

  const [range, setRange] = useState<ReportDateRangeValue>(defaultRange)
  const [format, setFormat] = useState<ReportFormat>('XLSX')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const allReports = useMemo<ReportDefinition[]>(
    () => categories.flatMap((c) => c.reports),
    [categories]
  )

  const selectedReports = useMemo(
    () => allReports.filter((r) => selected.has(r.id)),
    [allReports, selected]
  )

  // Drop any selected report that no longer supports the chosen format.
  const effectiveSelected = useMemo(() => {
    const next = new Set<string>()
    for (const r of selectedReports) {
      if (r.enabled && r.supportedFormats.includes(format)) {next.add(r.id)}
    }
    return next
  }, [selectedReports, format])

  const rangeError = range.endDate < range.startDate
    ? 'La fecha final no puede ser anterior a la inicial.'
    : undefined

  const canGenerate =
    effectiveSelected.size > 0 && !rangeError && !isSubmitting && !isProcessing

  const toggleReport = (reportId: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(reportId)) {next.delete(reportId)}
      else {next.add(reportId)}
      return next
    })
  }

  const toggleCategory = (reports: ReportDefinition[], selectAll: boolean): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const r of reports) {
        if (selectAll) {next.add(r.id)}
        else {next.delete(r.id)}
      }
      return next
    })
  }

  const handleGenerate = async (): Promise<void> => {
    if (!canGenerate) {return}
    await submit({
      reportIds: Array.from(effectiveSelected),
      format,
      startDate: toYMD(range.startDate),
      endDate: toYMD(range.endDate),
      timezone: 'America/Bogota'
    })
  }

  const categoriesSelected = useMemo(() => {
    const labels = new Set<string>()
    for (const group of categories) {
      if (group.reports.some((r) => effectiveSelected.has(r.id))) {labels.add(group.label)}
    }
    return Array.from(labels)
  }, [categories, effectiveSelected])

  return (
    <Column className={styles.panel}>
      {/* A. Header */}
      <header className={styles.header}>
        <Text as='h2' size='2xl' weight='semibold'>Exportar reportes</Text>
        <Text as='p' size='md' className={styles.muted}>
          Genera reportes detallados de tu operación, inventario, ventas y facturación.
          Selecciona la información que necesitas y descarga tus resultados.
        </Text>
      </header>

      {/* B. Period selector */}
      <section className={styles.section}>
        <ReportDateRangePicker
          label='Periodo'
          value={range}
          onChange={setRange}
          error={rangeError}
        />
      </section>

      {/* C. Dynamic catalog */}
      <section className={styles.section}>
        <Text as='h3' size='lg' weight='semibold'>Selecciona los reportes</Text>
        <ReportCatalog
          categories={categories}
          isLoading={isCatalogLoading}
          selected={selected}
          format={format}
          onToggle={toggleReport}
          onToggleCategory={toggleCategory}
        />
      </section>

      {/* E. Format selector */}
      <section className={styles.section}>
        <Text as='h3' size='lg' weight='semibold'>Formato de exportación</Text>
        <div className={styles.formatRow}>
          <button
            type='button'
            className={`${styles.formatOption} ${format === 'XLSX' ? styles.formatActive : ''}`}
            onClick={() => setFormat('XLSX')}
          >
            <Icon icon='IconExcel' size={24} />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            type='button'
            className={`${styles.formatOption} ${format === 'CSV' ? styles.formatActive : ''}`}
            onClick={() => setFormat('CSV')}
          >
            <Icon icon='IconDownload' size={24} />
            <span>CSV (.csv)</span>
          </button>
        </div>
        {format === 'CSV' && effectiveSelected.size > 1 && (
          <Text size='xs' className={styles.muted}>
            Al seleccionar varios reportes en CSV se genera un archivo ZIP con un CSV por reporte.
          </Text>
        )}
      </section>

      {/* F. Summary + generate */}
      <section className={styles.summary}>
        <div className={styles.summaryInfo}>
          <Text size='sm'>
            <strong>{effectiveSelected.size}</strong> reporte(s) ·{' '}
            {categoriesSelected.length > 0 ? categoriesSelected.join(', ') : 'Sin categorías'}
          </Text>
          <Text size='sm' className={styles.muted}>
            Periodo: {toYMD(range.startDate)} a {toYMD(range.endDate)} · Formato: {format}
          </Text>
        </div>
        <ButtonSuccess
          text='Generar reporte'
          onClick={handleGenerate}
          loading={isSubmitting}
          disabled={!canGenerate}
        />
      </section>

      {/* G. Generation progress */}
      {activeJob && (activeJob.status === 'PENDING' || activeJob.status === 'PROCESSING') && (
        <section className={styles.section}>
          <Text size='sm' weight='semibold'>
            {activeJob.status === 'PENDING' ? 'En cola...' : 'Generando reporte...'}
            {activeJob.stage ? ` · ${activeJob.stage}` : ''}
          </Text>
          <div className={styles.progressTrack}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
          <div className={styles.progressActions}>
            <Text size='xs' className={styles.muted}>{progress}%</Text>
            <button type='button' className={styles.linkButtonMuted} onClick={() => cancel(activeJob.id)}>
              Cancelar
            </button>
          </div>
        </section>
      )}

      {/* H. Recent history */}
      <RecentReportRequests
        requests={recentRequests}
        isLoading={isLoadingRecent}
        onDownload={downloadReport}
        onRetry={retry}
        onCancel={cancel}
      />

      <div style={{ height: getGlobalStyle('--spacing-md') }} />
    </Column>
  )
}
