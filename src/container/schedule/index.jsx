'use client'

import {
  convertToMilitaryTime,
  GET_ONE_SCHEDULE_STORE,
  GET_SCHEDULE_STORE,
  timeSuggestions,
  useCreateSchedules,
  useFormatDate,
  useLogout,
  useMobile,
  useScheduleData,
  useSchedules,
  useSetScheduleOpenAll,
  useStore
} from 'npm-pkg-hook'
import {
  AlertInfo,
  AwesomeModal,
  Checkbox,
  Column,
  getGlobalStyle,
  HeaderSteps,
  InputTimeHours,
  RippleButton,
  Row,
  ScheduleLinearWeekly,
  Text
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import PropTypes from 'prop-types'
import React, { useContext, useEffect, useState } from 'react'

import { Context } from '../../context/Context'
import { autocompleteStoreSchedules } from './helpers'

export const ScheduleTimings = ({ isChart = false }) => {
  const { setAlertBox } = useContext(Context)
  const [openStoreEveryDay, setOpenStoreEveryDay] = useState(false)
  const [data, { loading: lsc }] = useSchedules({ schDay: 1 })
  const [showTiming, setShowTiming] = useState(1)
  const [showModalTiming, setShowModalTiming] = useState(false)

  const { handleHourPmAM } = useFormatDate({})
  const { onClickLogout } = useLogout({})
  const { isMobile } = useMobile()
  const [setStoreSchedule, { loading }] = useCreateSchedules()
  const [handleSetStoreSchedule, { loading: loadingSchEday }] = useSetScheduleOpenAll()
  const [dataStore, { loading: loadingStore }] = useStore()

  useEffect(() => {
    if (dataStore && !loadingStore) {
      setOpenStoreEveryDay(Boolean(dataStore?.scheduleOpenAll))
    }
  }, [dataStore, loadingStore])

  const handleSetStoreScheduleEveryDay = () => {
    if (loadingStore || loadingSchEday) return

    const nextValue = !openStoreEveryDay
    setOpenStoreEveryDay(nextValue)
    handleSetStoreSchedule(nextValue)
  }

  const [values, setValues] = useState({
    endTime: null,
    startTime: null
  })

  const { startTime, endTime } = values

  const handleClick = (dayNumber, schedule) => {
    const validDay = Number.isNaN(dayNumber) ? 0 : dayNumber
    setShowTiming(validDay)

    const daySchedule = Array.isArray(data)
      ? data.find((day) => day?.schDay === dayNumber)
      : null

    setValues((currentValues) => ({
      ...currentValues,
      endTime: schedule?.schHoEnd || daySchedule?.schHoEnd || null,
      startTime: schedule?.schHoSta || daySchedule?.schHoSta || null
    }))
    setShowModalTiming((current) => !current)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((currentValues) => ({
      ...currentValues,
      [name]: value
    }))
  }

  function sumHours(hourOne, hourTwo) {
    const [hoursOne, minutesOne] = hourOne.split(':').map(Number)
    const [hoursTwo, minutesTwo] = hourTwo.split(':').map(Number)

    let sumHour = hoursOne + hoursTwo
    let sumMinutes = minutesOne + minutesTwo

    if (sumMinutes >= 60) {
      sumMinutes -= 60
      sumHour++
    }

    if (sumHour >= 24) {
      sumHour -= 24
    }

    return `${String(sumHour).padStart(2, '0')}:${String(sumMinutes).padStart(2, '0')}`
  }

  function isLessThanOneHour(hourOne, hourTwo) {
    const sum = sumHours(hourOne, hourTwo)
    const [sumHour, sumMinutes] = sum.split(':').map(Number)
    const totalMinutes = (sumHour * 60) + sumMinutes
    return totalMinutes < 60
  }

  const handleForm = async (event) => {
    event.preventDefault()
    if (loading || lsc) return

    if (!startTime || !endTime) {
      setAlertBox({ message: 'Llena todos los campos' })
      return
    }

    const startHour = convertToMilitaryTime(startTime)
    const endHour = convertToMilitaryTime(endTime)

    if (startHour === endHour) {
      setAlertBox({ message: 'Error, la hora de salida no debe ser igual a la hora final' })
      return
    }

    if (startHour > endHour) {
      setAlertBox({ message: 'Error, la hora de salida debe ser mayor que la de entrada' })
      return
    }

    if (isLessThanOneHour(startTime, endTime)) {
      setAlertBox({ message: 'Error, el horario debe ser mayor a una hora' })
      return
    }

    try {
      // Do not call cache.writeQuery from inside cache.modify. The modifier
      // receives a field value (an array), while writeQuery expects an object
      // shaped like { getStoreSchedules: [...] }. Refetch the active schedule
      // queries instead, preserving each query's original variables.
      const response = await setStoreSchedule({
        variables: {
          input: {
            schHoSta: startTime,
            schHoEnd: endTime,
            schState: 1,
            schDay: showTiming
          }
        },
        refetchQueries: [GET_SCHEDULE_STORE, GET_ONE_SCHEDULE_STORE],
        awaitRefetchQueries: true
      })

      const result = response?.data?.setStoreSchedule
      if (result?.message) {
        setAlertBox({ message: result.message })
      }

      const restaurantNotFoundMessage = 'El restaurante no existe'
      if (result?.message === restaurantNotFoundMessage) {
        setAlertBox({ message: restaurantNotFoundMessage })
        onClickLogout({ redirect: true })
      }

      if (result?.success) {
        setShowModalTiming(false)
        setValues({ endTime: null, startTime: null })
      }
    } catch (error) {
      setAlertBox({
        message: error instanceof Error ? error.message : 'No fue posible guardar el horario'
      })
    }
  }

  const { days } = useScheduleData(data)

  useEffect(() => {
    if (!showTiming) {
      setShowTiming(Number(new Date().getDay()))
    }
  }, [showTiming])

  const inlineStyle = {
    overflow: 'hidden',
    paddingTop: '0',
    margin: '0 auto',
    maxWidth: getGlobalStyle('--width-max-desktop')
  }

  const [active, setActive] = useState(0)
  const [overActive, setOverActive] = useState(0)

  const handleOverActive = (index) => {
    setOverActive(index)
  }

  const steps = ['Horarios', 'Con Horarios']

  return (
    <div style={inlineStyle}>
      <div style={{ width: '60%' }}>
        <HeaderSteps
          active={active}
          handleOverActive={handleOverActive}
          overActive={overActive}
          setActive={setActive}
          steps={steps}
        />
      </div>

      <div style={{ margin: '0 1.25rem' }}>
        <div style={{ width: '90%' }}>
          <AlertInfo
            message={active === 1
              ? 'Puedes marcar que el restaurante esta abierto las 24h'
              : 'Aquí puedes crear tus horarios de atención para programar tus actividades.'}
            type='warning'
          />
        </div>

        {active === 1 && (
          <Checkbox
            checked={openStoreEveryDay}
            id='checkboxF'
            label={openStoreEveryDay ? 'Abierto todos los días' : 'Con Horarios'}
            name='desc'
            onChange={handleSetStoreScheduleEveryDay}
          />
        )}
      </div>

      {active === 0 && (
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <ScheduleLinearWeekly
            handleClick={handleClick}
            handleHourPmAM={handleHourPmAM}
            isMobile={isChart || isMobile}
            openStoreEveryDay={openStoreEveryDay}
            schedules={autocompleteStoreSchedules(data)}
            style={openStoreEveryDay ? { filter: 'grayscale(1)' } : {}}
          />
        </div>
      )}

      <AwesomeModal
        borderRadius='10px'
        btnCancel={true}
        btnConfirm={false}
        customHeight='400px'
        footer={false}
        header={true}
        height='400px'
        onCancel={() => setShowModalTiming((current) => !current)}
        onHide={() => {
          setValues({ endTime: null, startTime: null })
          setShowModalTiming(false)
        }}
        padding='25px'
        show={showModalTiming}
        size={MODAL_SIZES.small}
        title={days?.[showTiming]}
        zIndex={getGlobalStyle('--z-index-99999')}
      >
        <form
          onSubmit={handleForm}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '100%'
          }}
        >
          <div>
            <AlertInfo message='Crea el horario de la tienda' type='warning' />
            <Row justifyContent='space-between'>
              <Column>
                <Text>Hora inicial</Text>
                <InputTimeHours
                  onSelected={(time) => handleChange({
                    target: { name: 'startTime', value: time }
                  })}
                  times={timeSuggestions}
                  value={values.startTime || ''}
                  width='200px'
                />
              </Column>
              <Column>
                <Text>Hora final</Text>
                <InputTimeHours
                  onSelected={(time) => handleChange({
                    target: { name: 'endTime', value: time }
                  })}
                  times={timeSuggestions}
                  value={values.endTime || ''}
                  width='200px'
                />
              </Column>
            </Row>
          </div>

          <RippleButton disabled={!endTime || !startTime || loading} type='submit'>
            {loading ? 'Cargando...' : 'Guardar'}
          </RippleButton>
        </form>
      </AwesomeModal>
    </div>
  )
}

ScheduleTimings.propTypes = {
  isChart: PropTypes.bool
}
