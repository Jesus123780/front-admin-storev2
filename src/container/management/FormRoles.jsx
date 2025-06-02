import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import {
  Column,
  RippleButton,
  Checkbox,
  Loading,
  InputHooks,
  getGlobalStyle,
  Text,
  Paragraph,
  Divider,
  AlertInfo
} from 'pkg-components'
import { useCreateRole } from 'npm-pkg-hook'
import { Context } from '../../context/Context'
import { permissions } from './helpers'
import { filterKeyObject } from '../../utils'
import styles from './styles.module.css'

export const FormRoles = ({
  dataForm,
  errorForm,
  selectedPermissions = [],
  transformedPermissions = {},
  setLoading = () => { return },
  setDataValue = () => { return },
  handleSubmit = () => { return },
  handleChange = () => { return },
  handleEditOneClient = () => { return },
  handleCheckboxChange = () => { return },
  handleShowModal = () => { return },
  isPermissionChecked = () => { return }
}) => {
  const { sendNotification } = useContext(Context)
  const [createRoleMutation, { loading }] = useCreateRole({
    sendNotification
  })

  const handleForm = (e) => {
    handleSubmit({
      event: e,
      action: () => {
        setLoading(true)
        if (selectedPermissions?.length <= 0) return sendNotification({
          title: 'Error',
          description: 'Debes elegir por lo menos un permiso al rol',
          backgroundColor: 'error'
        })
        const values = filterKeyObject({ ...dataForm }, ['toDate', 'fromDate'])
        return createRoleMutation({
          variables: {
            input: {
              ...values,
              permissions: transformedPermissions
            }
          },
          update: (cache, { data }) => {
            // update cache
            const { createRoleMutation } = data || {
              createRoleMutation: {
                success: false,
                message: ''
              }
            }
            const newClient = createRoleMutation?.data || {}
            cache.modify({
              fields: {
                getRoles(existingData = []) {
                  try {
                    return {
                      ...existingData,
                      data: [newClient, ...existingData.data ?? []]
                    }
                  } catch (e) {
                    return existingData
                  }
                }
              }
            })
          }

        }).then((response) => {
          const { createRoleMutation } = response?.data || {
            createRoleMutation: {
              success: false,
              message: ''
            }
          }
          const { success, message } = createRoleMutation ?? {
            success: false,
            message: ''
          }

          if (success) {
            setDataValue({})
            handleShowModal()
            setLoading(false)
            sendNotification({
              title: 'Éxito',
              description: message,
              backgroundColor: 'success'
            })
          }
        }).catch(() => {
          setLoading(false)
          return sendNotification({
            title: 'No se pudo crear el rol, intenta nuevamente',
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
        justifyContent='space-between'
        onSubmit={(e) => {
          e.preventDefault()
          return dataForm.update ? handleEditOneClient() : handleForm(e)
        }}
        style={{
          flexWrap: 'nowrap',
          height: '100%',
          width: '100%',
          justifyContent: 'space-between'
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
            height: 'min-content',
            justifyContent: 'space-between'
          }}
        >
          <InputHooks
            error={errorForm?.name}
            info='El nombre del rol es requerido'
            letters
            marginBottom={getGlobalStyle('--spacing-2xl')}
            name='name'
            onChange={handleChange}
            range={{
              max: 30,
              min: 0
            }}
            required
            title='Nombre del rol*'
            value={dataForm?.name}
            width='40%'
          />
          <InputHooks
            email={false}
            error={errorForm?.description}
            marginBottom={getGlobalStyle('--spacing-2xl')}
            name='description'
            onChange={handleChange}
            title='Descripción del rol'
            value={dataForm?.description}
            width='40%'
          />
          <AlertInfo message='Selecciona los permisos que deseas asignar a este rol.' type='warning' />
          <Column
            style={{
              flexFlow: 'wrap',
              gap: '1rem',
              columnGap: '10%',
              padding: '1rem',
              alignItems: 'center',
              height: 'min-content'
            }}
          >
            {permissions.map((group, groupIndex) => {
              return (
                <div key={groupIndex}>
                  <Text
                    as='h2'
                    size='5xl'
                    weight='medium'
                  >
                    {group.category.name}
                  </Text>
                  <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
                  <Paragraph
                    size='xxl'
                    weight='medium'
                  >
                    {group.category.description}
                  </Paragraph>
                  {group.category.permissions.map((permission, permIndex) => {
                    return (
                      <Checkbox
                        checked={isPermissionChecked(permission)}
                        id={`${groupIndex}-${permIndex}`}
                        key={permIndex}
                        label={`${permission.action} - ${permission.subject}`}
                        onChange={(event) => { return handleCheckboxChange(event, permission) }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </Column>
        </Column>
        <Column
          className={styles.bottom_actions}
          justifyContent='flex-end'
        >
          <RippleButton
            disabled={disabled || selectedPermissions.length === 0}
            height='100px'
            loading={loading}
            padding='0'
            radius={getGlobalStyle('--border-radius-2xs')}
            type='submit'
            widthButton='200px '
          >
            {dataForm.update ? 'Actualizar' : 'Guardar'}
          </RippleButton>
        </Column>
      </Column>
    </>
  )
}

FormRoles.propTypes = {
  dataForm: PropTypes.shape({
    ClientAddress: PropTypes.any,
    description: PropTypes.any,
    name: PropTypes.any,
    update: PropTypes.any
  }),
  errorForm: PropTypes.shape({
    ClientAddress: PropTypes.any,
    description: PropTypes.any,
    name: PropTypes.any
  }),
  handleChange: PropTypes.func,
  handleCheckboxChange: PropTypes.func,
  handleEditOneClient: PropTypes.func,
  handleShowModal: PropTypes.func,
  handleSubmit: PropTypes.func,
  isPermissionChecked: PropTypes.func,
  openModal: PropTypes.shape({
    setState: PropTypes.func,
    state: PropTypes.any
  }),
  selectedPermissions: PropTypes.array,
  setDataValue: PropTypes.func,
  setLoading: PropTypes.func,
  setOpenModal: PropTypes.func,
  transformedPermissions: PropTypes.object
}
