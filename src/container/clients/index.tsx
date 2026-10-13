'use client'

import {
  convertDateFormat,
  filterKeyObject,
  useDeleteClients,
  useEditClient,
  useFormTools,
  useGetClients,
  useGetOneClient
} from 'npm-pkg-hook'
import {
  AwesomeModal,
  Button,
  choices,
  Divider,
  getGlobalStyle,
  Icon,
  InputDate,
  InputHooks,
  Loading,
  Pagination,
  RippleButton,
  Section,
  Table,
  TableCell,
  Text
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import { useContext, useState } from 'react'

import { Context } from '../../context/Context'
import { FormClients } from './Form'
import styles from './styles.module.css'

/**
 * Configuración estable de columnas.
 *
 * Se mantiene fuera del componente para no crear
 * el arreglo en cada render.
 */
const CLIENT_COLUMNS = [
  {
    id: 'index',
    name: '#',
    key: '',
    justify: 'flex-start' as const,
    width: '70px',
    minWidth: 70,
    maxWidth: 90,
    draggable: false,
    resizable: false,
    sortable: false
  },
  {
    id: 'clientName',
    name: 'Nombre',
    key: 'clientName',
    justify: 'flex-start' as const,
    width: '1fr',
    minWidth: 160,
    maxWidth: 360,
    arrow: true,
    sortable: true,
    draggable: true,
    resizable: true
  },
  {
    id: 'clientLastName',
    name: 'Apellido',
    key: 'clientLastName',
    justify: 'flex-start' as const,
    width: '0.85fr',
    minWidth: 150,
    maxWidth: 300,
    arrow: true,
    sortable: true,
    draggable: true,
    resizable: true
  },
  {
    id: 'ClientAddress',
    name: 'Comentario',
    key: 'ClientAddress',
    justify: 'flex-start' as const,
    width: '1.15fr',
    minWidth: 180,
    maxWidth: 420,
    arrow: true,
    sortable: true,
    draggable: true,
    resizable: true
  },
  {
    id: 'createAt',
    name: 'Fecha de creación',
    key: 'createAt',
    justify: 'flex-start' as const,
    width: '180px',
    minWidth: 170,
    maxWidth: 260,
    arrow: true,
    sortable: true,
    draggable: true,
    resizable: true
  },
  {
    id: 'delete',
    name: 'Eliminar',
    key: '',
    justify: 'center' as const,
    width: '120px',
    minWidth: 110,
    maxWidth: 150,
    draggable: false,
    resizable: false,
    sortable: false
  },
  {
    id: 'details',
    name: 'Ver detalles',
    key: '',
    justify: 'center' as const,
    width: '140px',
    minWidth: 130,
    maxWidth: 180,
    draggable: false,
    resizable: false,
    sortable: false
  }
]

export const Clients = () => {
  const { sendNotification } = useContext(Context)

  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [openModal, setOpenModal] = useState(false)

  const [
    handleChange,
    handleSubmit,
    setDataValue,
    {
      dataForm,
      errorForm,
      errorSubmit
    }
  ] = useFormTools({
    sendNotification
  })

  const [
    deleteClient,
    {
      loading: loadingDelClient
    }
  ] = useDeleteClients({
    sendNotification
  })

  const [
    editOneClient,
    {
      loading: loadingEditClient
    }
  ] = useEditClient({
    sendNotification
  })

  const [getOneClients] =
    useGetOneClient({
      sendNotification
    })

  const [
    clients,
    {
      loading: loadingClients,
      refetch,
      buttonLoading
    }
  ] = useGetClients({
    max: 30,
    search: dataForm.search
  })

  /**
   * Según el console.log compartido,
   * clients ya es directamente un array.
   */
  const clientList = Array.isArray(clients)
    ? clients
    : []

  /**
   * ========================================
   * EDITAR CLIENTE
   * ========================================
   */
  const handleEditOneClient = () => {
    const updateNewClient =
      filterKeyObject(
        dataForm,
        [
          'update',
          '__typename',
          'idUser',
          'idStore'
        ]
      )

    editOneClient({
      variables: {
        input: {
          ...updateNewClient
        }
      },

      update: (
        cache,
        { data }
      ) => {
        const {
          editOneClient
        } = data ?? {}

        const {
          success,
          message
        } = editOneClient ?? {}

        if (!success) {
          return
        }

        cache.modify({
          fields: {
            getAllClients(
              existingData = {}
            ) {
              const existingClients =
                existingData.data ?? []

              const newData =
                existingClients.map(
                  client => {
                    if (
                      client.cliId ===
                      dataForm.cliId
                    ) {
                      return {
                        ...client,
                        ...dataForm
                      }
                    }

                    return client
                  }
                )

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
    })
  }

  /**
   * ========================================
   * OBTENER CLIENTE
   * ========================================
   */
  const handleGetOneClient = ({
    cliId
  }) => {
    getOneClients({
      variables: {
        cliId
      }
    }).then(res => {
      const client =
        res?.data?.getOneClients

      if (!client) {
        return
      }

      setDataValue({
        ...client,
        update: true
      })

      setOpenModal(true)
    })
  }

  /**
   * ========================================
   * ELIMINAR CLIENTE
   * ========================================
   */
  const handleDeleteOneClient = ({
    clState,
    cliId
  }) => {
    setLoading(true)

    deleteClient({
      variables: {
        clState,
        cliId
      },

      update: (
        cache,
        { data }
      ) => {
        const {
          deleteClient
        } = data ?? {}

        const {
          success,
          message
        } = deleteClient ?? {}

        if (!success) {
          return
        }

        cache.modify({
          fields: {
            getAllClients(
              existingData = {}
            ) {
              const existingClients =
                existingData.data ?? []

              const newData =
                existingClients.filter(
                  client =>
                    client.cliId !== cliId
                )

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
    })
      .then(response => {
        const errorMessage =
          response?.errors?.[0]?.message

        if (errorMessage) {
          sendNotification({
            title: 'Error',
            description:
              errorMessage,
            backgroundColor: 'error'
          })
        }
      })
      .finally(() => {
        setLoading(false)
      })
  }

  /**
   * ========================================
   * PAGINACIÓN
   * ========================================
   *
   * Si tu hook actualmente devuelve la
   * paginación por otra propiedad, puedes
   * conectarla aquí.
   */
  const pagination =
    clients?.pagination ?? {
      currentPage: 1,
      totalPages: 1
    }

  const handlePageChange = (
    pageNumber
  ) => {
    if (pageNumber < 1) {
      return
    }

    if (
      pagination.totalPages &&
      pageNumber >
        pagination.totalPages
    ) {
      return
    }

    setCurrentPage(
      pageNumber
    )

    refetch({
      page: pageNumber
    })
  }

  /**
   * ========================================
   * FILTROS DE FECHA
   * ========================================
   */
  const {
    fromDate,
    toDate
  } = dataForm ?? {
    fromDate: null,
    toDate: null
  }

  const disabled =
    !fromDate ||
    !toDate

  const handleSearchByDate = () => {
    if (
      !fromDate ||
      !toDate
    ) {
      return
    }

    const fromDateFormat =
      convertDateFormat({
        dateString: fromDate,
        start: true
      })

    const toDateFormat =
      convertDateFormat({
        dateString: toDate,
        start: false
      })

    refetch({
      fromDate:
        fromDateFormat,
      toDate:
        toDateFormat,
      page: currentPage
    })
  }

  /**
   * ========================================
   * RENDER
   * ========================================
   */
  return (
    <div
      style={{
        padding:
          getGlobalStyle(
            '--spacing-3xl'
          )
      }}
    >
      <AwesomeModal
        borderRadius='4px'
        btnCancel={true}
        btnConfirm={false}
        customHeight='60vh'
        footer={false}
        header={true}
        height='calc(100% - 50%)'
        onCancel={() => {
          return false
        }}
        onHide={() => {
          setOpenModal(
            previous => !previous
          )
        }}
        padding={0}
        question={false}
        show={openModal}
        size={
          MODAL_SIZES.medium
        }
        sizeIconClose='30px'
        title='Crear / Editar cliente'
        zIndex={
          getGlobalStyle(
            '--z-index-99999'
          )
        }
      >
        <FormClients
          dataForm={dataForm}
          errorForm={errorForm}
          errorSubmit={
            errorSubmit
          }
          handleChange={
            handleChange
          }
          handleEditOneClient={
            handleEditOneClient
          }
          handleSubmit={
            handleSubmit
          }
          openModal={
            openModal
          }
          setDataValue={
            setDataValue
          }
          setLoading={
            setLoading
          }
          setOpenModal={
            setOpenModal
          }
        />
      </AwesomeModal>

      {(
        loading ||
        loadingDelClient ||
        loadingClients ||
        loadingEditClient
      ) && <Loading />}

      <Text size='3xl'>
        Filtros
      </Text>

      <div
        className={
          styles['header-action']
        }
      >
        <InputHooks
          error={
            errorForm?.search
          }
          margin='none'
          marginBottom='none'
          name='search'
          onChange={
            handleChange
          }
          title='Busca por nombre'
          value={
            dataForm?.search
          }
          width='20%'
        />

        <InputDate
          date={
            dataForm?.fromDate
          }
          label='Desde'
          onChange={e => {
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
          showClearButton={
            dataForm?.fromDate
          }
          value={
            dataForm?.fromDate
          }
        />

        <InputDate
          date={
            dataForm?.toDate
          }
          label='Hasta'
          onChange={e => {
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
          showClearButton={
            dataForm?.toDate
          }
          value={
            dataForm?.toDate
          }
        />

        <RippleButton
          height='60px'
          loading={
            buttonLoading
          }
          onClick={() => {
            if (disabled) {
              refetch({
                fromDate: null,
                toDate: null,
                page: currentPage
              })

              return
            }

            handleSearchByDate()
          }}
          radius={
            getGlobalStyle(
              '--border-radius-2xs'
            )
          }
          style={{
            backgroundColor:
              disabled
                ? `${choices.color.brand.red}69`
                : choices.color.brand.red
          }}
          widthButton='20%'
        >
          Realizar consulta
        </RippleButton>

        <RippleButton
          height='60px'
          onClick={() => {
            setDataValue({})
            setOpenModal(
              previous => !previous
            )
          }}
          radius={
            getGlobalStyle(
              '--border-radius-2xs'
            )
          }
          style={{
            maxWidth: '300px'
          }}
          widthButton='20%'
        >
          Crear nuevo cliente
        </RippleButton>
      </div>

      <Divider
        marginTop={getGlobalStyle(
          '--spacing-3xl'
        )}
      />

      <div
        className='container-list__clients'
        style={{
          width: '100%',
          minWidth: 0
        }}
      >
        <Table
          data={clientList}
          pointer={true}
          header={true}

          /**
           * ============================
           * KEYBOARD
           * ============================
           */
          enableKeyboardNav={true}

          /**
           * ============================
           * RESIZE
           * ============================
           */
          enableColumnResize={true}

          /**
           * ============================
           * DRAG
           * ============================
           */
          enableColumnDrag={true}

          /**
           * ============================
           * MULTI SORT
           * ============================
           *
           * Shift + click permite agregar
           * criterios secundarios.
           */
          multiColumnSort={true}

          /**
           * ============================
           * PERSISTENCIA
           * ============================
           *
           * El navegador conserva:
           * - orden de columnas
           * - tamaños
           */
          columnStorageKey='clients-table-v2'

          /**
           * ============================
           * BODY REORDER
           * ============================
           *
           * Fundamental porque las filas
           * se construyen con children
           * en el orden original.
           */
          reorderBodyChildren={true}

          /**
           * Límites razonables para esta
           * tabla.
           */
          minColumnWidth={80}
          maxColumnWidth={500}

          titles={
            CLIENT_COLUMNS
          }

          renderBody={(
            dataB,
            titles,
            indexFirstElem
          ) => {
            return dataB.map(
              (
                client,
                index
              ) => {
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

                /**
                 * Conservamos exactamente
                 * tu regla de negocio actual.
                 */
                const ourStaticClient =
                  idStore !==
                  ccClient

                const tableRowIndex =
                  indexFirstElem +
                  index

                /**
                 * createAt actualmente
                 * puede ser null.
                 */
                const fullDate =
                  createAt
                    ? new Date(
                        createAt
                      ).toLocaleDateString(
                        'es-CO',
                        {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }
                      )
                    : ''

                return (
                  <Section
                    columnWidth={
                      titles
                    }
                    disabled={
                      ourStaticClient
                    }
                    key={cliId}
                    odd={true}
                    padding={`${getGlobalStyle(
                      '--spacing-3xl'
                    )} 0px`}
                  >
                    {/* ==================================
                        COLUMNA 1 - #
                        ================================== */}
                    <TableCell
                      row={
                        tableRowIndex
                      }
                      col={0}
                    >
                      <div
                        style={{
                          width:
                            '100%',
                          minWidth: 0
                        }}
                      >
                        <span>
                          {tableRowIndex +
                            1}
                        </span>
                      </div>
                    </TableCell>

                    {/* ==================================
                        COLUMNA 2 - NOMBRE
                        ================================== */}
                    <TableCell
                      row={
                        tableRowIndex
                      }
                      col={1}
                    >
                      <div
                        style={{
                          width:
                            '100%',
                          minWidth: 0,
                          overflow:
                            'hidden',
                          textOverflow:
                            'ellipsis',
                          whiteSpace:
                            'nowrap'
                        }}
                        title={
                          clientName ??
                          ''
                        }
                      >
                        <Text>
                          {clientName ??
                            ''}
                        </Text>
                      </div>
                    </TableCell>

                    {/* ==================================
                        COLUMNA 3 - APELLIDO
                        ================================== */}
                    <TableCell
                      row={
                        tableRowIndex
                      }
                      col={2}
                    >
                      <div
                        style={{
                          width:
                            '100%',
                          minWidth: 0,
                          overflow:
                            'hidden',
                          textOverflow:
                            'ellipsis',
                          whiteSpace:
                            'nowrap'
                        }}
                        title={
                          clientLastName ??
                          ''
                        }
                      >
                        <Text>
                          {clientLastName ??
                            ''}
                        </Text>
                      </div>
                    </TableCell>

                    {/* ==================================
                        COLUMNA 4 - COMENTARIO
                        ================================== */}
                    <TableCell
                      row={
                        tableRowIndex
                      }
                      col={3}
                    >
                      <div
                        style={{
                          width:
                            '100%',
                          minWidth: 0,
                          overflow:
                            'hidden',
                          textOverflow:
                            'ellipsis',
                          whiteSpace:
                            'nowrap'
                        }}
                        title={
                          ClientAddress ??
                          ''
                        }
                      >
                        <Text>
                          {ClientAddress ??
                            ''}
                        </Text>
                      </div>
                    </TableCell>

                    {/* ==================================
                        COLUMNA 5 - FECHA
                        ================================== */}
                    <TableCell
                      row={
                        tableRowIndex
                      }
                      col={4}
                    >
                      <div
                        style={{
                          width:
                            '100%',
                          minWidth: 0,
                          whiteSpace:
                            'nowrap'
                        }}
                      >
                        <Text>
                          {
                            fullDate
                          }
                        </Text>
                      </div>
                    </TableCell>

                    {/* ==================================
                        COLUMNA 6 - ELIMINAR
                        ================================== */}
                    <TableCell
                      row={
                        tableRowIndex
                      }
                      col={5}
                    >
                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'center',
                          alignItems:
                            'center',
                          width:
                            '100%',
                          minWidth: 0
                        }}
                      >
                        {ourStaticClient && (
                          <Button
                            border='none'
                            type='button'
                            onClick={() => {
                              handleDeleteOneClient(
                                {
                                  cliId,
                                  clState
                                }
                              )
                            }}
                          >
                            <Icon size={25} icon='IconDelete' />
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    {/* ==================================
                        COLUMNA 7 - VER DETALLES
                        ================================== */}
                    <TableCell
                      row={
                        tableRowIndex
                      }
                      col={6}
                    >
                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'center',
                          alignItems:
                            'center',
                          width:
                            '100%',
                          minWidth: 0
                        }}
                      >
                        {ourStaticClient && (
                          <button
                            type='button'
                            onClick={() => {
                              handleGetOneClient(
                                {
                                  cliId
                                }
                              )
                            }}
                          >
                            Ver detalles
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </Section>
                )
              }
            )
          }}
        />
      </div>

      <Divider
        marginTop={getGlobalStyle(
          '--spacing-3xl'
        )}
      />

      <Pagination
        currentPage={
          pagination.currentPage
        }
        handleNextPage={() => {
          handlePageChange(
            pagination.currentPage +
              1
          )
        }}
        handleOnClick={pageNumber => {
          handlePageChange(
            pageNumber
          )
        }}
        handlePrevPage={() => {
          handlePageChange(
            pagination.currentPage -
              1
          )
        }}
        isVisableButtonLeft={
          pagination.currentPage >
          1
        }
        isVisableButtonRight={
          pagination.currentPage <
          pagination.totalPages
        }
        isVisableButtons={
          Boolean(
            pagination.totalPages &&
              pagination.totalPages >
                1
          )
        }
        items={Array.from(
          {
            length:
              pagination.totalPages ??
              0
          },
          (_, index) =>
            index + 1
        )}
      />
    </div>
  )
}