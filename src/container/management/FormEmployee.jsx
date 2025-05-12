import PropTypes from 'prop-types'
import React, { useContext } from 'react'
import {
  Cookies,
  useCreateEmployeeStoreAndUser,
  useFormTools
} from 'npm-pkg-hook'
import { Context } from '../../context/Context'
import {
  AlertInfo,
  AwesomeModal,
  Button,
  Column,
  Divider,
  getGlobalStyle,
  InputHooks,
  NewSelect,
  Row
} from 'pkg-components'
// import { removeDoubleQuotes } from '../../apollo/helpers'

export const FormEmployee = ({
  roles = [],
  openModalEmployee = false,
  handleShowModalEmployee = () => { return null }
}) => {

  const { sendNotification } = useContext(Context)
  const [handleChange, handleSubmit, setDataValue, { dataForm, errorForm, setForcedError }] = useFormTools({ sendNotification })
  console.log("🚀 ~ errorForm:", errorForm)

  const onError = () => {
    // setForcedError({ ...errorForm, email: true })
  }

  const onCompleted = () => {
    setForcedError({ ...errorForm, email: false })
    setDataValue({
      idStore: null,
      idRole:  null,
      eEmail: null
    })
    handleShowModalEmployee()
  }
  const [createEmployeeStoreAndUser, { loading }] = useCreateEmployeeStoreAndUser({ 
    sendNotification, 
    onCompleted,
    onError
  })

  const handleForm = (e) => {
    return handleSubmit({
      event: e,
      action: () => {
        if (!dataForm.idRole) {
          return sendNotification({
            title: 'Complete todos los campos',
            description: 'error',
            backgroundColor: 'error'
          })
        }
        // const restaurant = removeDoubleQuotes(Cookies.get('restaurant'))
        return createEmployeeStoreAndUser({
          idStore: Cookies.get('merchant'),
          idRole: dataForm.idRole ?? null,
          eEmail: dataForm.email ?? null,
          nameEmployee: dataForm.nameEmployee
        })
      }
    })
  }

  return (
    <div>
      <AwesomeModal
        borderRadius='4px'
        btnCancel={true}
        btnConfirm={false}
        customHeight='60vh'
        footer={false}
        header={true}
        height='60vh'
        onCancel={() => { return false }}
        onHide={() => { handleShowModalEmployee() }}
        question={false}
        show={openModalEmployee}
        size='medium'
        sizeIconClose='30px'
        title='Crea un empleado'
        zIndex={getGlobalStyle('--z-index-99999')}
      >
        <Column
          as='form'
          onSubmit={handleForm}
          style={{
            height: '100%',
            justifyContent: 'space-between',
            padding: getGlobalStyle('--spacing-3xl')
          }}
        >
          <Column>
            <Row alignItems='center' justifyContent='space-between'>
              <InputHooks
                email={true}
                error={errorForm?.email}
                marginBottom={getGlobalStyle('--spacing-2xl')}
                name='email'
                onChange={handleChange}
                onInvalid={() => { return }}
                range={{
                  min: 0
                }}
                required={true}
                title='Email*'
                value={dataForm?.email}
                width='45%'
              />
              <InputHooks
                error={errorForm?.nameEmployee}
                letters={true}
                marginBottom={getGlobalStyle('--spacing-2xl')}
                name='nameEmployee'
                onChange={handleChange}
                onInvalid={() => { return }}
                range={{
                  min: 0
                }}
                required
                title='Nombre*'
                value={dataForm?.nameEmployee}
                width='45%'
              />

            </Row>
            <AlertInfo message='El tipo, número de identificación y correo, no se podrán modificar una vez se cree el usuario.' type='warning' />
            <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
            <NewSelect
              canDelete={true}
              dataForm={dataForm}
              error={errorForm.idRole}
              handleClean={setDataValue}
              id='idRole'
              name='idRole'
              onChange={handleChange}
              optionName={['name']}
              options={roles}
              required
              title='Selecciona un Rol'
              value={dataForm?.idRole}
              width='100%'
            />
          </Column>

          <Button loading={loading} primary>
            Crear empleado
          </Button>
        </Column>

      </AwesomeModal>

      <Column>
        <Button
          onClick={handleShowModalEmployee}
          primary={true}
          width='25rem'
        >
          Crear Empleado
        </Button>
      </Column>
    </div>
  )
}

FormEmployee.propTypes = {
  handleShowModalEmployee: PropTypes.func,
  openModalEmployee: PropTypes.bool,
  roles: PropTypes.array
}
