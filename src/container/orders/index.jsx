'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Button,
  InputQuery,
  DateRange,
  AlertInfo,
  EmptyData,
  getGlobalStyle,
  InputDate,
  Divider
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

export const Orders = () => {
  const [handleChange, handleSubmit, setDataValue, { dataForm }] = useFormTools()

  const getInitialDates = useMemo(() => {
    const todayRange = new UtilDateRange()
    const { start, end } = todayRange.getRange()

    return { fromDate: start, toDate: end }
  }, [])
  const initialDates = getInitialDates
  const [{ fromDate, toDate }, setDateValues] = useState(initialDates)
  
  const [data, { refetch }] = useOrdersFromStore({
    fromDate: fromDate,
    toDate: toDate,
    search: dataForm.search
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

  const onChangeInput = (e) => {

    const { value } = e.target
    console.log("🚀 ~ onChangeInput ~ e.target:", e.target)
    setDateValues({
      ...initialDates,
      [e.target.name]: value
    })
  }

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

  const handleClearFilters = () => {
   refetch({
      fromDate: value,
      toDate: value,
      search: dataForm.search
    })
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
          <div className={styles.container_query}>
            <InputQuery
              className={styles.input_query}
              dataForm={dataForm}
              handleChange={handleChange}
              placeholder='busca por ref de orden'
            />
          </div>
          <QuickFiltersButton
            onClick={() => {
              return
            }}
          />
          <InputDate
            date={fromDate}
            label='Desde'
            name='fromDate'
            onChange={(value) => {
              onChangeInput({
                target: {
                  name: 'fromDate',
                  value
                }
              })
            }}
            value={fromDate}
            width={'20%'}
          />
          <InputDate
            date={toDate}
            label='Hasta'
            name='toDate'
            onChange={(value) => {
              onChangeInput({
                target: {
                  name: 'toDate',
                  value
                }
              })
            }}
            type='date'
            value={toDate}
          />
          <Button
            borderRadius='5px'
            onClick={handleClearFilters}
            padding='0 10px'
            primary
            styles={{
              height: '3.75rem'
            }}
          >
            Borrar filtro
          </Button>
        </div>
        <Divider marginTop={getGlobalStyle('--spacing-xl')} />

        <DateRange
          endDate={toDate}
          startDate={fromDate}
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
