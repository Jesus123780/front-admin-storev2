'use client'

import React, { 
  useState, 
  useEffect, 
  useMemo
} from 'react'
import {
  Button,
  InputQuery,
  DateRange,
  AlertInfo,
  EmptyData,
  getGlobalStyle,
  InputDate,
  Divider,
  ToggleSwitch
} from 'pkg-components'
import {
  useFormTools,
  useOrdersFromStore,
  UtilDateRange
} from 'npm-pkg-hook'
import { Container } from './styled'
import { DragOrders } from './DragOrders'
import { QuickFiltersButton } from './QuickFiltersButton'
import styles from './styles.module.css'

export const OrdersMemo = () => {
  const [loading, setLoading] = useState(false) 
    const initialDates = useMemo(() => {
    const todayRange = new UtilDateRange()
    const { start, end } = todayRange.getRange()

    return { fromDate: start, toDate: end }
  }, [])
  const [inCludeRange, setIncludeRange] = useState(true)
  const [handleChange, handleSubmit, setDataValue, { dataForm }] = useFormTools({
    callback: () => {
      setDataValue({
        ...initialDates
      })
    }
  })

  const [data, { refetch }] = useOrdersFromStore({
    fromDate: dataForm.fromDate,
    toDate: dataForm.toDate
  })
  
  const [list, setList] = useState([
    {
      title: '',
      items: []
    },
    {
      title: '',
      items: []
    },
    {
      title: '',
      items: []
    },
    {
      title: '',
      items: []
    },
    {
      title: '',
      items: []
    }
  ])

  useEffect(() => {
    const { ACCEPT, PROCESSING, READY, CONCLUDES, REJECTED } = data || {}

    const orderStates = {
      ENTRANTES: ACCEPT,
      PROCESO: PROCESSING,
      LISTOS: READY,
      CONCLUIDOS: CONCLUDES,
      REJECTED: REJECTED
    }

    const updatedList = Object.keys(orderStates).map((key) => {
      return {
        title: `${key ?? ''}`,
        items: orderStates[key]
      }
    })

    setList(updatedList)
  }, [data])

  const handleClearFilters = async () => {
    try {
    setLoading(true)
    setDataValue({
      ...initialDates
    })
    await refetch({
    fromDate: initialDates.fromDate,
    toDate: initialDates.toDate,
    search: dataForm.search
    })
    setLoading(false)
  } catch (e) {
    setLoading(false)
  }
  }
  function areAllArraysEmpty(arr) {
    return arr.every((obj) => {
      return Array.isArray(obj.items) && obj.items.length === 0
    })
  }
  const emptyList = areAllArraysEmpty(list)

  return (
    <div style={{ padding: getGlobalStyle('--spacing-xl') }}>
      <Container>
        <AlertInfo
          message='Gestiona el estados de las ordenes'
          type='warning'
        />
        <Divider marginTop={getGlobalStyle('--spacing-xl')} />
        <div className={styles['quick-filters']}>
          {!inCludeRange && <ToggleSwitch
          checked={inCludeRange}
          id='include-range'
          label='Incluir rango de fechas en la busqueda'
          onChange={() => {

            setIncludeRange(!inCludeRange)
            }}
            successColor='green'
            />}
            <div className={styles.container_query}>
            <InputQuery
              className={styles.input_query}
              dataForm={dataForm}
              handleChange={(e) => {
                handleChange(e)
              // Espera a que termine de escribir antes de llamar a refetch
              if (window.searchTimeout) clearTimeout(window.searchTimeout)
              window.searchTimeout = setTimeout(() => {
              refetch({
                fromDate: dataForm.fromDate,
                toDate: dataForm.toDate,
                search: e.target.value
              })
              }, 500)
              }}
              placeholder='busca por ref de orden'
            />
            </div>
            <QuickFiltersButton
            onClick={() => {
              return
            }}
          />
          <InputDate
            date={dataForm.fromDate}
            label='Desde'
            disabled={!inCludeRange}
            name='fromDate'
            onChange={(value) => {
              handleChange({
                target: {
                  name: 'fromDate',
                  value
                }
              })
            }}
            value={dataForm.fromDate}
            width='20%'
          />
          <InputDate
            disabled={!inCludeRange}
            date={dataForm.toDate}
            label='Hasta'
            name='toDate'
            onChange={(value) => {
              handleChange({
                target: {
                  name: 'toDate',
                  value
                }
              })
            }}
            type='date'
            value={dataForm.toDate}
          />
          <Button
            borderRadius='5px'
            onClick={handleClearFilters}
            padding='0 10px'
            loading={loading}
            primary
            styles={{
              height: '3.75rem'
            }}
          >
            Quitar filtros
          </Button>
          <Button
            type='submit'
            borderRadius='5px'
            onClick={(e) => {
            handleSubmit({
            event: e,
            action: () => {
            setLoading(true)
            refetch({
              fromDate: dataForm.fromDate,
              toDate: dataForm.toDate,
              search: dataForm.search
            })
            setLoading(false)
      }
      })
             
            }}
            padding='0 10px'
            primary
            styles={{
              height: '3.75rem'
            }}
          >
            Realizar busqueda
          </Button>
        </div>
        <Divider marginTop={getGlobalStyle('--spacing-xl')} />

        <DateRange
          endDate={dataForm.toDate}
          startDate={dataForm.fromDate}
        />
        <Divider marginTop={getGlobalStyle('--spacing-xl')} />
        <div className='form-container-orders'></div>
        {emptyList ? (
          <EmptyData />
        ) : (
          <DragOrders list={list} />
        )}
      </Container>
    </div>
  )
}

export const Orders = React.memo(OrdersMemo)

OrdersMemo.displayName = 'OrdersMemo'
