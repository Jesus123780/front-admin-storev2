'use client'

import PropTypes from 'prop-types'
import {
  useSchedules,
  useMobile,
  useScheduleData,
  GET_ONE_SCHEDULE_STORE,
  useCreateSchedules,
  GET_SCHEDULE_STORE,
  useSetScheduleOpenAll,
  timeSuggestions,
  useLogout,
  useStore,
  convertToMilitaryTime,
  useFormatDate
} from 'npm-pkg-hook'
import React, {
  useContext,
  useEffect,
  useState
} from 'react'
import { Context } from '../../context/Context'
import {
  RippleButton,
  AwesomeModal,
  Checkbox,
  AlertInfo,
  HeaderSteps,
  ScheduleLinearWeekly,
  getGlobalStyle,
  InputTimeHours,
  Row,
  Column,
  Text
} from 'pkg-components'
import { autocompleteStoreSchedules } from './helpers'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'

export const ScheduleTimings = ({ isChart = false }) => {
  // STATES
  const { setAlertBox } = useContext(Context)
  const [openStoreEveryDay, setOpenStoreEveryDay] = useState(false)
  const [data, { loading: lsc }] = useSchedules({ schDay: 1 })
  const [showTiming, setShowTiming] = useState(1)
  const [showModalTiming, setShowModalTiming] = useState(false)
  // HOOKS
  const { handleHourPmAM } = useFormatDate({})
  const [onClickLogout] = useLogout({})
  const { isMobile } = useMobile()
  const [setStoreSchedule, { loading }] = useCreateSchedules()

  const [handleSetStoreSchedule, { loading: loadingSchEday }] = useSetScheduleOpenAll()
  const [dataStore, { loading: loadingStore }] = useStore()
  // EFFECTS
  useEffect(() => {
    if (dataStore && !loadingStore) {
      setOpenStoreEveryDay(dataStore?.scheduleOpenAll)
    }
  }, [dataStore, loadingStore])

  const handleSetStoreScheduleEveryDay = () => {
    if (loadingStore || loadingSchEday) return
    setOpenStoreEveryDay(!openStoreEveryDay)
    handleSetStoreSchedule(!openStoreEveryDay)
  }
  const [values, setValues] = useState({
    endTime: null,
    startTime: null
  })

  const { startTime, endTime } = values ?? {
    startTime: null,
    endTime: null
  }

  const handleClick = (n, s) => {
    if (Number.isNaN(n)) {
      setShowTiming(0)
    } else {
      setShowTiming(n)
    }
    const day = Array.isArray(data) ? data.find(day => { return day?.schDay === n }) : null
    const schHoEnd = s?.schHoEnd || day?.schHoEnd
    const schHoSta = s?.schHoSta || day?.schHoSta

    setValues({
      ...values,
      endTime: schHoEnd,
      startTime: schHoSta
    })
    setShowModalTiming(!showModalTiming)
  }

  const handleChange = e => {
    const { name, value } = e.target
    setValues({
      ...values,
      [name]: value
    })
  }

  function sumHours(hora1, hora2) {
    const [hora1Horas, hora1Minutos] = hora1.split(':').map(Number)
    const [hora2Horas, hora2Minutos] = hora2.split(':').map(Number)

    let sumaHour = hora1Horas + hora2Horas
    let sumMinutes = hora1Minutos + hora2Minutos

    if (sumMinutes >= 60) {
      sumMinutes -= 60
      sumaHour++
    }

    if (sumaHour >= 24) {
      sumaHour -= 24
    }

    const horaSumada = `${String(sumaHour).padStart(2, '0')}:${String(sumMinutes).padStart(2, '0')}`
    return horaSumada
  }
  function isLessThanOneHour(hora1, hora2) {
    const suma = sumHours(hora1, hora2)
    const [sumaHour, sumMinutes] = suma.split(':').map(Number)
    const totalMinutos = (sumaHour * 60) + sumMinutes

    if (totalMinutos < 60) {
      return true // La suma de las horas es menor a una hora
    } 
    return false // La suma de las horas es igual o mayor a una hora
    
  }
  const handleForm = (e) => {
    e.preventDefault()
    if (loading || lsc) return

    // eslint-disable-next-line consistent-return
    if (!startTime || !endTime) return setAlertBox({ message: 'Llena todos los campos' })

    const startHour = convertToMilitaryTime(startTime)
    const endHour = convertToMilitaryTime(endTime)
    // Comparar solo las horas y minutos
    if (startHour === endHour) {
      // eslint-disable-next-line consistent-return
      return setAlertBox({ message: 'Error, la hora de salida no debe ser igual a la hora final' })

    }
    if (startHour > endHour) {
      // eslint-disable-next-line consistent-return
      return setAlertBox({ message: 'Error, la hora de salida debe ser mayor que la de entrada' })
    }
    if (isLessThanOneHour(startTime, endTime)) {
      // eslint-disable-next-line consistent-return
      return setAlertBox({ message: 'Error, el horario debe ser mayor a una hora' })
    }
    setStoreSchedule({
      variables: {
        input: {
          schHoSta: startTime,
          schHoEnd: endTime,
          schState: 1,
          schDay: showTiming
        }
      }, update(cache) {
        cache.modify({
          fields: {
            getStoreSchedules(dataOld = []) {
              return cache.writeQuery({ query: GET_SCHEDULE_STORE, data: dataOld })
            },
            getOneStoreSchedules(dataOld = []) {
              return cache.writeQuery({ query: GET_ONE_SCHEDULE_STORE, data: dataOld })
            }
          }
        })
      }
    }).then((res) => {
      if (res?.data?.setStoreSchedule?.message) {
        setAlertBox({ message: res?.data?.setStoreSchedule?.message })
      }
      const label = 'El restaurante no existe'
      if (res?.data?.setStoreSchedule?.message === label) {
        setAlertBox({ message: label })
        onClickLogout({ redirect: true })
      }
      setShowModalTiming(!showModalTiming)
      setValues({
        endTime: null,
        startTime: null
      })
    })
  }

  const { days } = useScheduleData(data)

  useEffect(() => {
    if (!showTiming) {
      const date = new Date()
      const currentDay = Number(date.getDay())
      setShowTiming(currentDay)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
  const steps = [
    'Horarios',
    'Con Horarios'
  ]
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
      <div style={{ margin: '0 1.25rem' }} >
        <div
          style={{
            width: '90%'
          }}
        >
          <AlertInfo
            message={active === 1 
              ? 'Puedes marcar que el restaurante esta abierto las 24h' 
              : 'Aquí puedes crear tus horarios de atención para programar tus actividades.'} 
            type='warning'
          />
        </div>
        {Boolean(active === 1) 
        && <Checkbox
          checked={openStoreEveryDay}
          id='checkboxF'
          label={openStoreEveryDay ? 'Abierto todos los días' : 'Con Horarios'}
          name='desc'
          onChange={handleSetStoreScheduleEveryDay}
        />
        }
      </div>
      {active === 0 && 
      <div
        style={{ 
          width: '100%',
          overflow: 'hidden'
        }}
      >
        <ScheduleLinearWeekly
          handleClick={handleClick}
          handleHourPmAM={handleHourPmAM}
          isMobile={isChart || isMobile}
          openStoreEveryDay={openStoreEveryDay}
          schedules={autocompleteStoreSchedules(data)}
          style={openStoreEveryDay ? { filter: 'grayscale(1)' } : {}}
        />
      </div>

      }
      <AwesomeModal
        borderRadius='10px'
        btnCancel={true}
        btnConfirm={false}
        customHeight='400px'
        footer={false}
        header={true}
        height='400px'
        onCancel={() => { return setShowModalTiming(!showModalTiming) }}
        onHide={() => {
          setValues({
            endTime: null,
            startTime: null
          })
          setShowModalTiming(!showModalTiming)
        }}
        padding='25px'
        show={showModalTiming}
        size={MODAL_SIZES.small}
        title={days[showTiming]}
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
                <Text>
                  Hora inicial
                </Text>
                <InputTimeHours
                  onSelected={(time) => {
                    handleChange({ target: {
                      name: 'startTime',
                      value: time
                    } })
                  }}
                  times={timeSuggestions}
                  value={values.startTime || ''}
                  width='200px'
                />
              </Column>
              <Column>
                <Text>
                  Hora final
                </Text>
                <InputTimeHours
                  onSelected={(time) => {
                    handleChange({ target: {
                      name: 'endTime',
                      value: time
                    } })
                  }}
                  times={timeSuggestions}
                  value={values.endTime || ''}
                  width='200px'
                />
              </Column>
            </Row>
          </div>
          
          <RippleButton disabled={!endTime || !startTime} type='submit'>
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
