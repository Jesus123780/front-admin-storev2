'use client'

import React, { useContext, useState } from 'react'
import {
  AwesomeModal,
  Column,
  Divider,
  getGlobalStyle,
  Row,
  Stepper
} from 'pkg-components'
import {
  useGetRoles,
  convertDateFormat,
  useFormTools
} from 'npm-pkg-hook'
import { Context } from '../../context/Context'
import { FormRoles } from './FormRoles'
import { FormEmployee } from './FormEmployee'
import { ListEmployee } from './ListEmployee'
import { ListRoles } from './ListRoles'

export const ContainerManagement = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [openModal, setOpenModal] = useState(false)

  const { sendNotification } = useContext(Context)
  const [handleChange, handleSubmit, setDataValue, { dataForm, errorForm, errorSubmit }] = useFormTools({ sendNotification })

  const [data, { refetch }] = useGetRoles()

  const pagination = data?.pagination ?? {
    currentPage: 1,
    totalPages: 1
  }
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    refetch({ page: pageNumber })
  }
  const { fromDate, toDate } = dataForm ?? {
    fromDate: null,
    toDate: null
  }
  const disabled = !fromDate || !toDate

  const handleSearchByDate = () => {
    const fromDateFormat = convertDateFormat({
      dateString: fromDate,
      start: true
    })
    const toDateFormat = convertDateFormat({
      dateString: toDate,
      start: false
    })
    if (fromDate && toDate) {
      refetch({
        fromDate: fromDateFormat,
        toDate: toDateFormat,
        page: currentPage
      })
    }
  }
  const handleEditOneClient = () => {
    return
  }
  const handleShowModal = () => {
    setOpenModal(!openModal)
    return null
  }
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const transformPermissions = (permissions) => {
    return permissions.reduce((acc, { action, subject }) => {
      if (!acc[subject]) {
        acc[subject] = []
      }
      if (!acc[subject].includes(action)) {
        acc[subject].push(action)
      }
      return acc
    }, {})
  }
  const transformedPermissions = transformPermissions(selectedPermissions)

  console.log(transformedPermissions)
  const handleCheckboxChange = (event, permission) => {
    if (event.target.checked) {
      setSelectedPermissions([...selectedPermissions, permission])
    } else {
      setSelectedPermissions(
        selectedPermissions.filter((p) => { return p.action !== permission.action || p.subject !== permission.subject })
      )
    }
  }

  const isPermissionChecked = (permission) => {
    return selectedPermissions.some(
      (p) => { return p.action === permission.action && p.subject === permission.subject }
    )
  }
  const [active, setActive] = useState(0)

  const steps = ['Crea un rol', 'Crea un empleado']
  const [openModalEmployee, setOpenModalEmployee] = useState(false)
  
  const handleShowModalEmployee = () => {
    setOpenModalEmployee(!openModalEmployee)
    return null
  }
  return (
    <div
      style={{
        maxWidth: getGlobalStyle('--width-max-desktop'),
        margin: 'auto',
        padding: getGlobalStyle('--spacing-xl')
      }}
    >
      <Column
        style={{
          width: '25rem'
        }}
      >
        <Stepper
          active={active}
          key={1}
          onClick={(index) => {
            return setActive(index)
          }}
          steps={steps}
        />
      </Column>
      <Divider marginBottom={getGlobalStyle('--spacing-4xl')} />
      {active === 0 && <>
        <AwesomeModal
          borderRadius='4px'
          btnCancel={true}
          btnConfirm={false}
          footer={false}
          header={true}
          height='100vh'
          onCancel={() => { return false }}
          onHide={() => { handleShowModal() }}
          question={false}
          show={openModal}
          size='large'
          sizeIconClose='30px'
          title='Crea un rol'
          zIndex={getGlobalStyle('--z-index-99999')}
        >
          <FormRoles
            dataForm={dataForm}
            errorForm={errorForm}
            errorSubmit={errorSubmit}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            handleEditOneClient={handleEditOneClient}
            handleShowModal={handleShowModal}
            handleSubmit={handleSubmit}
            isPermissionChecked={isPermissionChecked}
            openModal={openModal}
            selectedPermissions={selectedPermissions}
            setDataValue={setDataValue}
            setOpenModal={setOpenModal}
            transformedPermissions={transformedPermissions}
          />
        </AwesomeModal>

        <Row
          alignItems='center'
          justifyContent='space-between'
          style={{
            flexWrap: 'wrap'
          }}
        >
        </Row>
        <Column
          style={{
            borderRadius: getGlobalStyle('--border-radius-xs'),
            width: '100%'
          }}
        >
          <ListRoles
            handlePageChange={handlePageChange}
            pagination={pagination}
            roles={data?.data ?? []}
          />
        </Column>

      </>
      }
      {active === 1 &&
        (
          <Column>
            <FormEmployee 
              handleShowModalEmployee={handleShowModalEmployee}  
              openModalEmployee={openModalEmployee}  
              roles={data?.data ?? []}
            />
            <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
            <ListEmployee />
          </Column>
        )
      }
    </div>
  )
}
