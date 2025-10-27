import {
  useDownloadReportByDay,
  useFormatDate,
  useGetReportByDateRange,
  UtilDateRange} from 'npm-pkg-hook'
import {
  ButtonSuccess,
  Column,
  HeaderSteps,
  Icon,
  Text} from 'pkg-components'
import { useContext, useState } from 'react'

import { Context } from '@/context/Context'

import styles from './styles.module.css'

const titleHeaders = ['DIARIO', 'POR SEMANA', 'ULTIMO MES']
const descriptionHeaders = [
  'Descarga el reporte de ventas del día.',
  'Descarga el reporte de ventas de la semana. actualmente en curso.',
  'Descarga el reporte de ventas del último mes (30 días).'
]

export const ReportDownloadsPanel = () => {
  const { sendNotification } = useContext(Context)
  const { formatToLocalDateYMD } = useFormatDate()

  const [downloadReport, { loading, finished }] = useDownloadReportByDay({
    sendNotification
  })
  const [getReport, {
    loading: loadingReportRange,
    finished: finishedReportRange,
    error,
    data
  }] = useGetReportByDateRange({
    sendNotification
  })
  console.log({ loading: loadingReportRange })
  const [active, setActive] = useState(0)

  const handleDownload = async ({
    days = 7
  }) => {
    const todayRange = new UtilDateRange()
    const { start, end } = todayRange.getRange()

    const now = new Date()
    const sevenDaysAgo = new Date()
    const startDate = formatToLocalDateYMD(sevenDaysAgo.setDate(now.getDate() - days))
    const endDate = formatToLocalDateYMD(now)
    const result = await getReport(startDate, endDate)

    if (result?.success) {
      sendNotification({
        description: result?.message || 'Reporte descargado exitosamente',
        title: 'Reporte descargado',
        backgroundColor: 'success'
      })
    } else {
      sendNotification({
        description: result?.message || 'Error al descargar el reporte',
        title: 'Error al descargar reporte',
        backgroundColor: 'error'
      })
    }
  }
  const actions = [
    { label: 'Descargar Diario', onClick: () => downloadReport(1) },
    { label: 'Descargar Por Semana', onClick: () => handleDownload({ days: 7 }) },
    { label: 'Descargar Ultimo Mes', onClick: () => handleDownload({ days: 30 }) }
  ]

  const loadingState: Record<number, boolean> = {
    0: loading,
    1: loadingReportRange,
    2: false
  }

  const finishedState: Record<number, boolean> = {
    0: finished,
    1: finishedReportRange,
    2: false
  }

  return (
    <Column className={styles.panel}>
      <HeaderSteps setActive={setActive} active={active} steps={titleHeaders} />

      <div className={styles.card}>
        <Icon size={48} icon='IconExcel' />
        <Text as='h3' size='lg' className={styles.cardTitle}>
          Reporte {titleHeaders[active].toLocaleLowerCase()}
        </Text>
        <Text size='sm' className={styles.cardDescription}>
          {descriptionHeaders[active]}
        </Text>
        <ButtonSuccess
          text='Descargar Reporte'
          onClick={() => {
            actions[active]?.onClick?.()
          }}
          finished={finishedState[active]}
          loading={loadingState[active]}
          disabled={loading}
        />
      </div>
    </Column>
  )
}
