'use client'

import { useRouter } from 'next/navigation'
import { useStockMovements, useTotalAllSales, useTotalProductsInStock, useTotalProductsSolded, useWeeklyStockMovement } from 'npm-pkg-hook'
import { Column, getGlobalStyle, Icon, Text } from 'pkg-components'
import PropTypes from 'prop-types'
import { ReportGrid } from '../../../ReportGrid'
import { StockMovementsChart } from '../StockMovementsChart'
import { comparisonText, formatUnits, formatWeek } from './weekly-stock-view'
import styles from './styles.module.css'

export const InventoryPerformance = ({ filter }) => {
  const router = useRouter()
  const [stocksMovements] = useStockMovements(filter)
  const [weeks, { loading, error, refetch }] = useWeeklyStockMovement()
  const [totalProductsInStock] = useTotalProductsInStock()
  const [totalProductSold] = useTotalProductsSolded()
  const { netTotal, totalDiscount } = useTotalAllSales()
  const kpis = [
    { label:'Valor total de ventas concluidas',value:netTotal??0,numberformat:true,icon:{icon:'IconUpTrend',color:getGlobalStyle('--color-icons-success'),size:28} },
    { label:'Valor total descuentos aplicados',value:totalDiscount??0,numberformat:true,icon:{icon:'IconPromo',color:getGlobalStyle('--color-icons-success'),size:28} },
    { label:'Unidades en inventario',value:totalProductsInStock??0,icon:{icon:'IconInventory',color:getGlobalStyle('--color-icons-warning'),size:28},actionIcon:'IconUpRightArrow',onClick:()=>router.push('/products/units') },
    { label:'Unidades despachadas',value:totalProductSold??0,icon:{icon:'IconSales',color:getGlobalStyle('--color-icons-secondary'),size:28} }
  ]
  const refresh = () => { void refetch().catch(()=>{}) }
  const available = weeks.some(row=>row.totalOut!==null)
  const ordered = [...weeks].reverse()
  return (
    <section aria-label='Rendimiento del inventario' className={styles.section}>
      <Column className={styles.sectionHeader} gap='xs'>
        <Text as='h2' className={styles.sectionTitle} size='xl' weight={700}>Rendimiento del inventario</Text>
        <Text as='p' className={styles.sectionSubtitle} size='md'>Métricas de stock, entradas y salidas de inventario</Text>
      </Column>
      <div className={styles.kpiGrid}><ReportGrid data={kpis}/></div>
      <StockMovementsChart chartData={stocksMovements} className={styles.graphics} timezone={filter?.timezone} title='Entradas y Salidas de Inventario por día'/>
      <section aria-label='Variación semanal de inventario' aria-busy={loading} className={styles.weeklySection}>
        <Column className={styles.weeklyHeader} gap='xs'>
          <div className={styles.weeklyHeaderActions}>
            <Text as='h3' className={styles.weeklyTitle} size='lg' weight={700}>Movimiento semanal</Text>
            <button type='button' className={styles.refreshButton} disabled={loading} onClick={refresh}>{loading?'Actualizando…':'Actualizar'}</button>
          </div>
          <Text as='p' className={styles.weeklySubtitle} size='md'>Últimas siete semanas · Colombia · productos y complementos</Text>
          <p className={styles.periodNote}>La semana actual está en curso y se compara con la semana anterior completa. Este reporte es independiente del filtro diario.</p>
        </Column>
        {error ? <div className={styles.emptyState} role='alert'><p>No se pudieron consultar los movimientos semanales.</p><button type='button' className={styles.refreshButton} onClick={refresh}>Reintentar</button></div>
          : loading && !weeks.length ? <div className={styles.emptyState} role='status'>Cargando movimientos semanales…</div>
            : !weeks.length ? <div className={styles.emptyState} role='status'>No hay información semanal disponible.</div>
              : <>
                {!available && <p className={styles.periodNote} role='status'>Todavía no existe historial de inventario registrado para este periodo.</p>}
                <div className={styles.weeklyGrid}>
                  {ordered.map(row=>{
                    const up=row.comparisonStatus==='INCREASED'||row.comparisonStatus==='NEW_ACTIVITY'
                    const down=row.comparisonStatus==='DECREASED'
                    const tone=up?styles.percentagePositive:down?styles.percentageNegative:styles.percentageNeutral
                    return <article key={row.weekStart} className={`${styles.weekCard} ${row.isCurrent?styles.currentWeek:''}`}>
                      <div className={styles.weekCardHeader}><p className={styles.weekRange}>{formatWeek(row.weekStart,row.weekEnd)}</p>{row.isCurrent&&<span className={styles.currentLabel}>En curso</span>}</div>
                      <p className={styles.weekUnits}>{formatUnits(row.totalOut)}</p>
                      <p className={styles.unitLabel}>Unidades despachadas registradas</p>
                      <div className={`${styles.percentageRow} ${tone}`}>
                        {(up||down)&&<Icon color={getGlobalStyle(up?'--color-icons-success':'--color-icons-error')} icon={up?'IconUpRightArrow':'IconDownRightArrow'} size={20}/>}
                        <span>{comparisonText(row)}</span>
                      </div>
                      {row.prevTotalOut!==null&&<p className={styles.previousUnits}>Semana anterior: {formatUnits(row.prevTotalOut)}</p>}
                      {row.historyPartial&&<p className={styles.periodNote}>Historial disponible desde una fecha dentro de esta semana.</p>}
                    </article>
                  })}
                </div>
              </>}
      </section>
    </section>
  )
}
InventoryPerformance.propTypes = { filter: PropTypes.object }
