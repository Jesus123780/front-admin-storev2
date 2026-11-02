import { StatusBadge, Text } from 'pkg-components'

import {
 formatDateTime, formatDuration, statusVisual 
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
 * Compact history of the authenticated user's five most recent export
 * requests. Shows the period, format, status (via the shared StatusBadge) and
 * state-dependent actions (download/retry/cancel).
 *
 * @param props - Component props.
 * @returns The rendered history section.
 */
export const RecentReportRequests: React.FC<RecentReportRequestsProps> = ({
  requests,
  isLoading,
  onDownload,
  onRetry,
  onCancel
}) => {
  return (
    <section className={styles.section}>
      <Text as='h3' size='lg' weight='semibold'>
        Solicitudes recientes
      </Text>

      {isLoading && requests.length === 0 && (
        <Text size='sm' className={styles.muted}>Cargando solicitudes...</Text>
      )}

      {!isLoading && requests.length === 0 && (
        <Text size='sm' className={styles.muted}>Aún no has generado reportes.</Text>
      )}

      <ul className={styles.recentList}>
        {requests.map((job) => {
          const visual = statusVisual(job.status)
          const canDownload = job.status === 'COMPLETED'
          const canRetry = job.status === 'FAILED'
          const canCancel = job.status === 'PENDING' || job.status === 'PROCESSING'
          return (
            <li key={job.id} className={styles.recentItem}>
              <div className={styles.recentMain}>
                <div className={styles.recentHeader}>
                  <Text size='sm' weight='semibold'>
                    {job.reportIds.length === 1
                      ? '1 reporte'
                      : `${job.reportIds.length} reportes`} · {job.format}
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
                  Solicitado: {formatDateTime(job.createdAt)}
                  {job.durationMs ? ` · ${formatDuration(job.durationMs)}` : ''}
                </Text>
                {job.status === 'PROCESSING' && (
                  <div className={styles.miniProgressTrack}>
                    <div className={styles.miniProgressBar} style={{ width: `${job.progress}%` }} />
                  </div>
                )}
                {job.status === 'FAILED' && job.errorMessage && (
                  <Text size='xs' className={styles.errorText}>{job.errorMessage}</Text>
                )}
              </div>

              <div className={styles.recentActions}>
                {canDownload && (
                  <button type='button' className={styles.linkButton} onClick={() => onDownload(job)}>
                    Descargar
                  </button>
                )}
                {canRetry && (
                  <button type='button' className={styles.linkButton} onClick={() => onRetry(job.id)}>
                    Reintentar
                  </button>
                )}
                {canCancel && (
                  <button type='button' className={styles.linkButtonMuted} onClick={() => onCancel(job.id)}>
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
