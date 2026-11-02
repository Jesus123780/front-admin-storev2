'use client'

import { StatusBadge, Text } from 'pkg-components'
import type { FC } from 'react'

import {
  formatDateTime,
  formatDuration,
  statusVisual
} from './helpers'
import type { ReportJob } from './reports.types'
import styles from './styles.module.css'

interface RecentReportRequestsProps {
  requests: ReportJob[]
  isLoading: boolean
  onDownload: (job: ReportJob) => void
  onRetry: (jobId: string) => void
  onCancel: (jobId: string) => void
}

/**
 * Displays the authenticated user's latest report-export requests.
 *
 * Each item includes its period, format, status, optional progress or error,
 * and the action allowed by its current state.
 *
 * @param props - History data and action callbacks.
 * @returns The recent report requests section.
 */
export const RecentReportRequests: FC<RecentReportRequestsProps> = ({
  requests,
  isLoading,
  onDownload,
  onRetry,
  onCancel
}) => {
  if (isLoading && requests.length === 0) {
    return (
      <section className={styles.section} aria-labelledby='recent-reports-title'>
        <Text as='h3' id='recent-reports-title' size='lg' weight='semibold'>
          Solicitudes recientes
        </Text>
        <ul className={styles.recentList} aria-label='Cargando solicitudes recientes'>
          {[0, 1, 2].map((item) => (
            <li key={item} className={styles.recentSkeleton} aria-hidden='true' />
          ))}
        </ul>
      </section>
    )
  }

  if (!isLoading && requests.length === 0) {
    return (
      <section className={styles.section} aria-labelledby='recent-reports-title'>
        <Text as='h3' id='recent-reports-title' size='lg' weight='semibold'>
          Solicitudes recientes
        </Text>
        <div className={styles.stateBox}>
          <span className={styles.emptyIcon} aria-hidden='true'>
            <span className={styles.emptyIconGlyph}>↓</span>
          </span>
          <Text size='sm' weight='semibold'>Aún no has generado reportes</Text>
          <Text size='xs' className={styles.muted}>
            Tus últimas cinco solicitudes aparecerán aquí para que puedas consultar
            su estado o descargar nuevamente los archivos.
          </Text>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section} aria-labelledby='recent-reports-title'>
      <div className={styles.sectionHead}>
        <Text as='h3' id='recent-reports-title' size='lg' weight='semibold'>
          Solicitudes recientes
        </Text>
        {isLoading && (
          <span className={styles.loadingHint} role='status'>
            <span className={styles.loadingDot} aria-hidden='true' />
            Actualizando
          </span>
        )}
      </div>

      <ul className={styles.recentList}>
        {requests.map((job) => {
          const visual = statusVisual(job.status)
          const canDownload = job.status === 'COMPLETED'
          const canRetry = job.status === 'FAILED'
          const canCancel = job.status === 'PENDING' || job.status === 'PROCESSING'
          const reportCount = Array.isArray(job.reportIds) ? job.reportIds.length : 0
          const progressValue = job.progress
          const progress = typeof progressValue === 'number' && Number.isFinite(progressValue)
            ? Math.min(100, Math.max(0, progressValue))
            : 0
          const durationMs = job.durationMs
          const duration = typeof durationMs === 'number' && Number.isFinite(durationMs) && durationMs > 0
            ? ` · ${formatDuration(durationMs)}`
            : ''

          return (
            <li key={job.id} className={styles.recentItem}>
              <div className={styles.recentMain}>
                <div className={styles.recentHeader}>
                  <Text size='sm' weight='semibold'>
                    {reportCount === 1 ? '1 reporte' : `${reportCount} reportes`} · {job.format}
                  </Text>
                  <StatusBadge
                    id={job.id}
                    size='sm'
                    statusOrder={{
                      idStatus: job.id,
                      name: visual.name,
                      color: visual.color,
                      backgroundColor: visual.backgroundColor
                    }}
                  />
                </div>

                <Text size='xs' className={styles.muted}>
                  Periodo: {job.startDate} a {job.endDate}
                </Text>
                <Text size='xs' className={styles.muted}>
                  Solicitado: {formatDateTime(job.createdAt)}{duration}
                </Text>

                {job.status === 'PROCESSING' && (
                  <div
                    className={styles.miniProgressTrack}
                    role='progressbar'
                    aria-label={`Progreso del reporte ${job.id}`}
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={styles.miniProgressBar}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {job.status === 'FAILED' && (
                  <Text size='xs' className={styles.errorText}>
                    {job.errorMessage || 'No fue posible generar este reporte.'}
                  </Text>
                )}
              </div>

              <div className={styles.recentActions}>
                {canDownload && (
                  <button
                    type='button'
                    className={styles.linkButton}
                    onClick={() => onDownload(job)}
                    aria-label={`Descargar reporte solicitado el ${formatDateTime(job.createdAt)}`}
                  >
                    Descargar
                  </button>
                )}
                {canRetry && (
                  <button
                    type='button'
                    className={styles.linkButton}
                    onClick={() => onRetry(job.id)}
                    aria-label={`Reintentar generación del reporte ${job.id}`}
                  >
                    Reintentar
                  </button>
                )}
                {canCancel && (
                  <button
                    type='button'
                    className={styles.linkButtonMuted}
                    onClick={() => onCancel(job.id)}
                    aria-label={`Cancelar reporte ${job.id}`}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default RecentReportRequests
