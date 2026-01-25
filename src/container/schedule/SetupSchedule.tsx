'use client'

import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import { 
  AlertInfo,
  AwesomeModal,
  RippleButton,
  Row,
  SetupSchedule as SetupSchedulePkg, 
  Toast, 
  getGlobalStyle
} from 'pkg-components'
import { 
  useSetupSchedule, 
  getTotalHours, 
  isValidTimeString
} from 'npm-pkg-hook'
import { useRouter } from 'next/navigation'
import { Context } from '../../context/Context'

export const SetupSchedule = ({
  setOpenModal = () => {
    return null
  }
}) => {
  const router = useRouter()

  const { sendNotification, messagesToast } = useContext(Context)

  const { id } = router.query ?? {
    id: null
  }

  const { 
    days, 
    selectedDays, 
    times, 
    handleSelectedDay,
    alertModal,
    setAlertModal,
    selectedDay,
    loading,
    handleDeleteSchedule,
    onChangeSaveHour
  } = useSetupSchedule({ idStore: id, sendNotification })
  const totalHours = getTotalHours(days)

  const getHour = (timeString) => {
    // Validate time string format (HH:MM)
    if (!isValidTimeString(timeString)) {
      return '' // Return empty string for invalid time strings
    }
  
    const [hours] = timeString.split(':')
  
    // Return only the hour
    return hours.toString().padStart(2, '0')
  }
  const hours = getHour(totalHours)
  const maxHours = 10
  const progressPercentage = (hours / maxHours) * 100

  return (
    <div>
      <div
        style={{
          zIndex: getGlobalStyle('--z-index-high'),
          position: 'fixed',
          right: '35px',
          display: 'flex',
          justifyContent: 'flex-end',
          width: 'min-content'
        }}
      >
        <Toast
          autoDelete={true}
          autoDeleteTime={9000}
          position={'top-right'}
          toastList={messagesToast}
        />
      </div>
      <SetupSchedulePkg 
        days={days} 
        dynamicDays={days} 
        handleDeleteSchedule={handleDeleteSchedule} 
        handleSelectedDay={handleSelectedDay}
        hours={progressPercentage} 
        loading={loading} 
        onChangeSaveHour={onChangeSaveHour}
        selectedDays={selectedDays}
        setOpenModal={setOpenModal}
        times={times}
        totalHours={hours} 
      />
      <AwesomeModal
        customHeight='30%'
        footer={false}
        header={true}
        onHide={() => {
          return setAlertModal(false)
        }}
        padding={getGlobalStyle('--spacing-lg')}
        show={alertModal}
        size='40%'
        title='¿Eliminar este producto?'
        zIndex={getGlobalStyle('--z-index-99999')}
      >
        <AlertInfo
          message='¿Está seguro de que desea eliminar el horario? Perderás todos los horarios configurados para ese día.'
          type='warning'
        />
        <Row>
          <RippleButton
            margin={getGlobalStyle('--spacing-md')}
            onClick={() => {
              return setAlertModal(false)
            }}
          >
            Cancelar
          </RippleButton>
          <RippleButton
            loading={false}
            margin={getGlobalStyle('--spacing-md')}
            onClick={() => {
              return handleDeleteSchedule(selectedDay.schDay)
            }}
          >
            Confirmar
          </RippleButton>
        </Row>
      </AwesomeModal>
    </div>
  )
}

SetupSchedule.propTypes = {
  setOpenModal: PropTypes.func
}
