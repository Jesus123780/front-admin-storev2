'use client'

import PropTypes from 'prop-types'
import React, { useState, useContext } from 'react'
import {
  Column,
  RippleButton,
  Checkbox,
  Loading,
  InputHooks,
  PhoneInput,
  Row,
  getGlobalStyle
} from 'pkg-components'
import { useCreateClient } from 'npm-pkg-hook'
import { Context } from '../../context/Context'
import styles from './styles.module.css'

export const FormClients = ({
  dataForm,
  errorForm,
  setLoading = () => { return },
  setDataValue = () => { return },
  handleSubmit = () => { return },
  handleChange = () => { return },
  handleEditOneClient = () => { return }
}) => {
  const { sendNotification } = useContext(Context)
  const [createClients, { loading }] = useCreateClient({
    sendNotification
  })
  const [setCheck, setChecker] = useState({
    gender: 1
  })
  const handleCheck = (e) => {
    const { name, checked } = e.target
    setChecker({ ...setCheck, [name]: checked ? 1 : 0 })
  }
  const handleForm = (e) => {
    handleSubmit({
      event: e,
      action: () => {
        setLoading(true)
        return createClients({
          variables: {
            input: {
              ...dataForm,
              gender: setCheck.gender
            }
          },
          update: (cache, { data }) => {
            // update cache
            const { createClients } = data || {
              createClients: {
                success: false,
                message: ''
              }
            }
            const newClient = createClients?.data || {}
          
            cache.modify({
              fields: {
                getAllClients (existingData = {}) {
                  const existingClients = existingData.data || []
                  const newData = [newClient, ...existingClients] // Incluye el nuevo cliente en la lista
                  
                  return {
                    ...existingData,
                    data: newData
                  }
                }
              }
            })
          }
          
        }).then((response) => {
          const { createClients } = response?.data || {
            createClients: {
              success: false,
              message: ''
            }
          }
          const { success, message } = createClients ?? {
            success: false,
            message: ''
          }
          if (!success) {
            const { errors } = createClients
            for (const error of errors) {
              sendNotification({  
                title: 'Error',
                description: `${error.message}`,
                backgroundColor: 'error'
              })
            }
          }
          if (success) {
            setDataValue({})
            setLoading(false)
            sendNotification({
              title: message,
              description: 'Éxito',
              backgroundColor: 'success'
            })
          }
        }).catch(() => {
          setLoading(false)
          return sendNotification({
            title: 'No se pudo crear el cliente, intenta nuevamente',
            description: 'Error',
            backgroundColor: 'error'
          })
        })
      }
    })
    setLoading(false)
  }
  const disabled = Object.values(errorForm).find((error) => {
    return error === true
  })

  return (
    <>
      {loading && <Loading />}
      <Column
        as='form'
        className={styles.warper_form}
        justifyContent='space-between'
        onSubmit={(e) => {
          e.preventDefault()
          return dataForm.update ? handleEditOneClient() : handleForm(e)
        }}
        style={{
          flexWrap: 'nowrap'
        }}
      >
        <Column
          className={styles.container_form}
          justifyContent='center'
          style={{
            flexFlow: 'wrap',
            gap: '1rem',
            columnGap: '10%',
            padding: '1rem',
            alignItems: 'center',
            height: 'min-content'
          }}
        >
          <InputHooks
            error={errorForm?.clientName}
            info='El nombre del cliente es requerido'
            letters
            marginBottom={getGlobalStyle('--spacing-2xl')}
            name='clientName'
            onChange={handleChange}
            range={{
              max: 30,
              min: 0
            }}
            required
            title='Nombre del cliente*'
            value={dataForm?.clientName}
            width='40%'
          />
          <InputHooks
            error={errorForm?.clientLastName}
            info='El apellido del cliente es opcional'
            letters
            marginBottom={getGlobalStyle('--spacing-2xl')}
            name='clientLastName'
            onChange={handleChange}
            range={{
              max: 30,
              min: 0
            }}

            required={false}
            title='Apellido'
            value={dataForm?.clientLastName}
            width='40%'
          />
          <InputHooks
            error={errorForm?.ClientAddress}
            info='La dirección del cliente es opcional'
            marginBottom={getGlobalStyle('--spacing-2xl')}
            name='ClientAddress'
            onChange={handleChange}
            required={false}
            title='Dirección'
            value={dataForm?.ClientAddress}
            width='40%'
          />
          <InputHooks
            email={false}
            error={errorForm?.ccClient}
            marginBottom={getGlobalStyle('--spacing-2xl')}
            name='ccClient'
            numeric={true}
            onChange={handleChange}
            title='# de identidad'
            value={dataForm?.ccClient}
            width='40%'
          />
          <PhoneInput
            name='clientNumber'
            onChange={(e) => {
              return handleChange({
                target: {
                  name: 'clientNumber',
                  value: e
                }
              })
            }}
            style={{
              width: '40%',
              marginBottom: '1rem'
            }}
            value={dataForm?.clientNumber}
          />
          <Row
            style={{
              width: '40%'
            }}
          >
            <Checkbox
              checked={!!setCheck?.gender && setCheck?.gender === 1}
              disabled={false}
              id='gender'
              label={setCheck?.gender === 1 ? 'Femenino' : 'Masculino'}
              name='gender'
              onChange={(e) => { return handleCheck(e) }}
              value={setCheck?.gender}
            />
            <input
              name='gender'
              onChange={(e) => { return handleCheck(e) }}
              style={{
                backgroundColor: 'transparent',
                opacity: '0',
                border: '1px solid',
                position: 'absolute',
                top: '5px',
                width: 'min-content'
              }}
              type='checkbox'
              value={setCheck.gender}
            />
          </Row>
        </Column>
        <Column className={styles.bottom_actions} >
          <RippleButton
            disabled={disabled}
            height='50px'
            loading={loading}
            type='submit'
            widthButton='100% '
          >
            {dataForm.update ? 'Actualizar' : 'Guardar'}
          </RippleButton>
        </Column>
      </Column>
    </>
  )
}

FormClients.propTypes = {
  dataForm: PropTypes.shape({
    ClientAddress: PropTypes.any,
    ccClient: PropTypes.any,
    clientLastName: PropTypes.any,
    clientName: PropTypes.any,
    clientNumber: PropTypes.any,
    update: PropTypes.any
  }),
  errorForm: PropTypes.shape({
    ClientAddress: PropTypes.any,
    ccClient: PropTypes.any,
    clientLastName: PropTypes.any,
    clientName: PropTypes.any,
    clientNumber: PropTypes.any
  }),
  handleChange: PropTypes.func,
  handleEditOneClient: PropTypes.func,
  handleSubmit: PropTypes.func,
  openModal: PropTypes.shape({
    setState: PropTypes.func,
    state: PropTypes.any
  }),
  setDataValue: PropTypes.func,
  setLoading: PropTypes.func,
  setOpenModal: PropTypes.func
}
