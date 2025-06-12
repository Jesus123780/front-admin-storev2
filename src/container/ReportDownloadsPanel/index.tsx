import { Column, Divider, getGlobalStyle, HeaderSteps, Icon, Text } from 'pkg-components'
import { useDownloadReportByDay, useGetReportByDateRange } from 'npm-pkg-hook'
import { useState } from 'react'
import styles from './styles.module.css'

const titleHeaders = ['DIARIO', 'POR SEMANA', 'ULTIMO MES']
const descriptionHeaders = [
  'Descarga el reporte de ventas del día.',
  'Descarga el reporte de ventas de la semana. actualmente en curso.',
  `Descarga el reporte de ventas del último mes (30 días).`
]

export const ReportDownloadsPanel = () => {
  const [downloadReport, { loading }] = useDownloadReportByDay()
  const [getReport, { loading: loadingReportRange, error, data }] = useGetReportByDateRange()
  const [active, setActive] = useState(0)
  const handleDownload = async () => {

    const now = new Date()
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(now.getDate() - 6)

    const startDate = sevenDaysAgo.toISOString().split('T')[0]
    const endDate = now.toISOString().split('T')[0]

    const result = await getReport(startDate, endDate)

    if (result?.success) {
      alert('✅ Report ready! ' + result.data.name)
      // podrías iniciar la descarga aquí si tienes acceso a la URL completa
    } else {
      alert('❌ No report: ' + result?.message)
    }
  }
  const actions = [
    { label: 'Descargar Diario', onClick: () => downloadReport(1) },
    { label: 'Descargar Por Semana', onClick: handleDownload },
  ]
  return (
    <Column className={styles.panel}>
      <Text as='h2' size='3xl' className={styles.title}>
        Descargas de Reportes
      </Text>
      <Text size='md' className={styles.subtitle}>
        Selecciona el tipo de reporte que deseas descargar.
      </Text>

      <Divider marginTop={getGlobalStyle('--spacing-md')} />

      <HeaderSteps setActive={setActive} active={active} steps={titleHeaders} />

      <div className={styles.card}>
        <Icon size={48} icon='IconExcel' />

        <Text as='h3' size='lg' className={styles.cardTitle}>
          Reporte {titleHeaders[active].toLocaleLowerCase()}
        </Text>

        <Text size='sm' className={styles.cardDescription}>
          {descriptionHeaders[active]}
        </Text>

        <button
          className={styles.downloadButton}
          onClick={() => { 
            actions[active]?.onClick?.()
          }}
          disabled={loading}
        >
          {loading ? 'Descargando...' : 'Descargar'}
        </button>
      </div>
    </Column>
  )
}
