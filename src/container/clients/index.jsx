'use client'

import {
  convertDateFormat,
  filterKeyObject,
  useDeleteClients,
  useEditClient,
  useFormTools,
  useGetClients,
  useGetOneClient} from 'npm-pkg-hook'
import {
  AwesomeModal,
  choices,
  Divider,
  getGlobalStyle,
  InputDate,
  InputHooks,
  Loading,
  Pagination,
  RippleButton,
  Section,
  Table,
  Text} from 'pkg-components'
import { useContext, useState } from 'react'

import { Context } from '../../context/Context'
import { FormClients } from './Form'
import styles from './styles.module.css'

export const Clients = () => {
  const { sendNotification } = useContext(Context)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [handleChange, handleSubmit, setDataValue, { dataForm, errorForm, errorSubmit }] = useFormTools({ sendNotification })
  const [deleteClient, { loading: loadingDelClient }] = useDeleteClients({ sendNotification })
  const [editOneClient, { loading: loadingEditClient }] = useEditClient({ sendNotification })
  const [getOneClients] = useGetOneClient({ sendNotification })
  const [openModal, setOpenModal] = useState(false)
  const [clients, {
    loading: loadingClients,
    refetch,
    buttonLoading
  }] = useGetClients({
    max: 30,
    search: dataForm.search
  })

  const handleEditOneClient = () => {
    const updateNewClient = filterKeyObject(dataForm, ['update', '__typename', 'idUser', 'idStore'])
    editOneClient({
      variables: {
        input: {
          ...updateNewClient
        }
      }, update: (cache, { data }) => {
        const { editOneClient } = data ?? {}
        const { success, message } = editOneClient ?? {}
        if (success) {
          cache.modify({
            fields: {
              getAllClients(existingData = {}) {
                const existingClients = existingData.data ?? []
                const newData = existingClients.map((client) => {
                  if (client.cliId === dataForm.cliId) {
                    return {
                      ...client,
                      ...dataForm
                    }
                  }
                  return client
                })
                return {
                  ...existingData,
                  data: newData
                }
              }
            }
          })
          sendNotification({
            title: 'Success',
            description: message,
            backgroundColor: 'success'
          })
        }
      }
    })
  }
  const handleGetOneClient = ({ cliId }) => {
    getOneClients({
      variables: {
        cliId: cliId
      }
    }).then((res) => {
      if (res?.data?.getOneClients) {
        setDataValue({ ...res?.data?.getOneClients, update: true })
        setOpenModal(!openModal)
      }
    })
  }
  const handleDeleteOneClient = ({ clState, cliId }) => {
    setLoading(true)
    deleteClient({
      variables: {
        clState,
        cliId
      },
      update: (cache, { data }) => {
        const { deleteClient } = data ?? {

        }
        const { success, message } = deleteClient ?? {}
        if (success) {
          cache.modify({
            fields: {
              getAllClients(existingData = {}) {
                const existingClients = existingData.data ?? []
                const newData = existingClients.filter((client) => {
                  return client.cliId !== cliId
                })
                return {
                  ...existingData,
                  data: newData
                }
              }
            }
          })
          sendNotification({
            title: 'Success',
            description: message,
            backgroundColor: 'success'
          })
        }
      }
    }).then((response) => {
      if (response?.errors && response?.errors[0]?.message) {
        sendNotification({
          title: 'Error',
          description: response?.errors[0]?.message,
          backgroundColor: 'error'
        })
      }
      setLoading(false)
    }).finally(() => {
      setLoading(false)
    })

  }

  const pagination = clients?.pagination ?? {
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

  return (
    <div
      style={{
        padding: getGlobalStyle('--spacing-3xl')
      }}
    >
      <AwesomeModal
        borderRadius='4px'
        btnCancel={true}
        btnConfirm={false}
        customHeight='60vh'
        footer={false}
        header={true}
        height='60vh'
        onCancel={() => { return false }}
        onHide={() => { setOpenModal(!openModal) }}
        padding={0}
        question={false}
        show={openModal}
        size='600px'
        sizeIconClose='30px'
        title=''
        zIndex={getGlobalStyle('--z-index-99999')}
      >
        <FormClients
          dataForm={dataForm}
          errorForm={errorForm}
          errorSubmit={errorSubmit}
          handleChange={handleChange}
          handleEditOneClient={handleEditOneClient}
          handleSubmit={handleSubmit}
          openModal={openModal}
          setDataValue={setDataValue}
          setLoading={setLoading}
          setOpenModal={setOpenModal}
        />
      </AwesomeModal>
      {(loading || loadingDelClient || loadingClients || loadingEditClient) && <Loading />}
      <Text size='3xl'>
        Filtros
      </Text>
      <div className={styles['header-action']}>
        <InputHooks
          error={errorForm?.search}
          margin='none'
          marginBottom='none'
          name='search'
          onChange={handleChange}
          title='Busca por nombre'
          value={dataForm?.search}
          width='20%'
        />
        <InputDate
          date={dataForm?.fromDate}
          label='Desde'
          onChange={(e) => {
            handleChange({
              target: {
                name: 'fromDate',
                value: e
              }
            })
          }}
          onCleanValue={() => {
            if (disabled) {
              refetch({
                fromDate: null,
                toDate: null,
                page: currentPage
              })
            }
            setDataValue({
              ...dataForm,
              fromDate: null
            })
          }}
          showClearButton={dataForm?.fromDate}
          value={dataForm?.fromDate}
        />
        <InputDate
          date={dataForm?.toDate}
          label='Hasta'
          onChange={(e) => {
            handleChange({
              target: {
                name: 'toDate',
                value: e
              }
            })
          }}
          onCleanValue={() => {
            if (disabled) {
              refetch({
                fromDate: null,
                toDate: null,
                page: currentPage
              })
            }
            setDataValue({
              ...dataForm,
              toDate: null
            })
          }}
          showClearButton={dataForm?.toDate}
          value={dataForm?.toDate}
        />
        <RippleButton
          height='60px'
          loading={buttonLoading}
          onClick={() => {
            if (disabled) {
              refetch({
                fromDate: null,
                toDate: null,
                page: currentPage
              })
            } else {
              handleSearchByDate()
            }
          }}
          radius={getGlobalStyle('--border-radius-2xs')}
          style={{
            backgroundColor: disabled ? `${choices.color.brand.red}69` : choices.color.brand.red
          }}
          widthButton='20%'
        >
          Realizar consulta
        </RippleButton>
        <RippleButton
          height='60px'
          onClick={() => {
            setDataValue({})
            return setOpenModal(!openModal)
          }}
          radius={getGlobalStyle('--border-radius-2xs')}
          style={{ maxWidth: '300px' }}
          widthButton='20%'
        >
          Crear nuevo cliente
        </RippleButton>
      </div>
      <Divider marginTop={getGlobalStyle('--spacing-3xl')} />
      <div className='container-list__clients'>
        <Table
          data={clients?.data?.length > 0 ? clients?.data : []}
          labelBtn='Product'
          padding={getGlobalStyle('--spacing-3xl')}
          renderBody={(dataB, titles) => {
            return dataB?.map((client, i) => {
              const {
                cliId,
                clientName,
                clState,
                ccClient,
                createAt,
                ClientAddress,
                clientLastName,
                idStore
              } = client
              const dateToFormat = new Date(createAt ?? Date.now())
              const fullDate = dateToFormat.toLocaleDateString('ES', { year: 'numeric', month: '2-digit', day: '2-digit' })
              const ourStaticClient = idStore !== ccClient
              return <Section
                columnWidth={titles}
                disabled={ourStaticClient}
                key={cliId}
                odd
                padding={`${getGlobalStyle('--spacing-3xl')} 0px`}
              >
                <div>
                  <span> {i + 1}</span>
                </div>
                <div>
                  <span>{clientName}</span>
                </div>
                <div>
                  <span> {clientLastName}</span>
                </div>
                <div>
                  <span> {ClientAddress}</span>
                </div>
                <div>
                  <span>{fullDate ?? ''}</span>
                </div>
                {ourStaticClient &&
                  <>
                    <div>
                      <button onClick={() => { return handleDeleteOneClient({ cliId, clState }) }}>
                        Eliminar
                      </button>
                    </div>
                    <div>
                      <button onClick={() => { return handleGetOneClient({ cliId, clState }) }}>
                        Ver detalles
                      </button>
                    </div>
                  </>
                }
              </Section>
            })
          }}
          titles={[
            { name: '#', justify: 'flex-start', width: '.5fr' },
            { name: 'Nombre', key: 'clientName', justify: 'flex-start', width: '1fr' },
            { name: 'Apellido', key: 'clientLastName', justify: 'flex-start', width: '.5fr' },
            { name: 'Comentario', justify: 'flex-start', width: '.5fr' },
            { name: 'Fecha de creación', justify: 'flex-start', width: '.5fr' },
            { name: 'Eliminar', justify: 'flex-start', width: '.5fr' },
            { name: 'Ver detalles', justify: 'flex-start', width: '.5fr' }
          ]}
        />
      </div>
      <Divider marginTop={getGlobalStyle('--spacing-3xl')} />
      <Pagination
        currentPage={pagination.currentPage}
        handleNextPage={() => { return handlePageChange(pagination.currentPage + 1) }}
        handleOnClick={(pageNumber) => { return handlePageChange(pageNumber) }}
        handlePrevPage={() => { return handlePageChange(pagination.currentPage - 1) }}
        isVisableButtonLeft={pagination.currentPage > 1}
        isVisableButtonRight={pagination.currentPage < pagination.totalPages}
        isVisableButtons={Boolean(pagination?.totalPages ?? 0 > 1)}
        items={Array.from({ length: pagination.totalPages ?? 0 }, (_, index) => { return index + 1 })}
      />
    </div>
  )
}
