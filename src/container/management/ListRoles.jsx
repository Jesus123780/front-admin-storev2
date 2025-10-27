import {
  useCheckboxState,
  useRemoveRoles,
  useUpdateRolesPriority} from 'npm-pkg-hook'
import {
  Button,
  CheckboxCube,
  Divider,
  DragDropContext,
  Draggable,
  Droppable,
  getGlobalStyle,
  Icon,
  Pagination,
  Row,
  Section,
  Table} from 'pkg-components'
import PropTypes from 'prop-types'
import React, { useContext, useEffect, useMemo, useState } from 'react'

import { Context } from '../../context/Context'

export function ListRoles({
  roles = [],
  pagination = {
    currentPage: 1,
    totalPages: 1
  },
  handlePageChange = () => { return null }
}) {
  const { sendNotification } = useContext(Context)
  const [roleList, setRoleList] = useState([])
  const [checkAll, setCheckAll] = useState(false)
  const [handleUpdateRolesPriority] = useUpdateRolesPriority()
  const [removeRoles] = useRemoveRoles()
  const roleIds = roles.map(role => { return role.idRole })
  const {
    checkedItems,
    disabledItems,
    handleChangeCheck,
    toggleAll
  } = useCheckboxState(roleIds, [])
  // HANDLES
  const handleOnDragEnd = (result) => {
    if (!result.destination) {return}

    // Crear una copia de la lista de roles
    const reorderedItems = Array.from(roleList)
    const [movedItem] = reorderedItems.splice(result.source.index, 1)
    reorderedItems.splice(result.destination.index, 0, movedItem)

    // Actualizar prioridades para que sean únicas y secuenciales
    const updatedItems = reorderedItems.map((item, index) => {
      return {
        ...item,
        priority: index + 1
      }
    })

    // Actualizar el estado con los ítems reorganizados
    setRoleList(updatedItems)
    const updatedItemsDb = reorderedItems.map((item, index) => {
      return {
        idRole: item.idRole ?? null,
        priority: index + 1
      }
    })
    handleUpdateRolesPriority(updatedItemsDb)
  }


  const getItemStyle = (isDragging, draggableStyle) => {
    return {
      userSelect: 'none',
      padding: 16,
      backgroundColor: isDragging && getGlobalStyle('--color-background-gray-light'),
      ...draggableStyle
    }
  }
  const handleRemoveRoles = () => {
    if (checkedItems.size === 0) {return}
    const checkedItemsArray = [...checkedItems]
    removeRoles({ roleIds: checkedItemsArray })
    setRoleList(prevState => { return prevState.filter(role => { return !checkedItemsArray.includes(role.idRole) }) })
    sendNotification({
      description: checkedItems.size > 1 ? 'Se han eliminado los Roles seleccionados' : 'Se han eliminado el Rol seleccionado',
      title: 'Éxito',
      backgroundColor: 'success'
    })
  }

  const isAllChecked = useMemo(() => { return checkedItems.size === roleList.length && roleList.length > 0 }, [checkedItems, roleList])

  // EFFECTS
  useEffect(() => { setRoleList(roles) }, [roles])
  useEffect(() => { setCheckAll(isAllChecked) }, [isAllChecked])

  return (
    <div>
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId='droppable'>
          {(provided) => {
            return (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <Table
                  data={roleList}
                  renderBody={(data, titles) => {
                    return (
                      data.map((role, index) => {
                        const {
                          name,
                          createdAt,
                          description,
                          idRole
                        } = role
                        const fullDate = new Date(createdAt ?? Date.now()).toLocaleDateString('ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })

                        return (
                          <Draggable
                            draggableId={`${idRole}`}
                            index={index}
                            key={idRole}
                          >
                            {(provided, snapshot) => {
                              return (
                                <Section
                                  columnWidth={titles}
                                  odd={true}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={getItemStyle(
                                    snapshot.isDragging,
                                    provided.draggableProps.style
                                  )}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    style={{
                                      cursor: 'grab',
                                      padding: '20px',
                                      backgroundColor: getGlobalStyle('--color-base-transparent'),
                                      ...provided.dragHandleProps.style
                                    }}
                                  >
                                    <Icon
                                      color={getGlobalStyle('--color-icons-gray')}
                                      icon='IconDragHandle'
                                      size={20}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <CheckboxCube
                                      checked={checkedItems.has(idRole)}
                                      disabled={disabledItems.has(idRole)}
                                      id={idRole}
                                      onChange={(e) => {
                                        return handleChangeCheck(e, idRole)
                                      }}
                                    />
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                                    <span>{name}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <span>{description}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <span>{fullDate}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                                    <button
                                      onClick={() => {
                                        removeRoles({ roleIds: [idRole] })
                                        setRoleList(prevState => { return prevState.filter(role => { return role.idRole !== idRole }) })
                                      }}
                                      style={{
                                        backgroundColor: getGlobalStyle('--color-base-transparent'),
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <Icon
                                        color={getGlobalStyle('--color-icons-primary')}
                                        icon='IconDelete'
                                        size={20}
                                      />
                                    </button>
                                  </div>
                                  <Button
                                    onClick={() => { }}
                                    styles={{
                                      border: 'none',
                                      backgroundColor: 'transparent'
                                    }}
                                  >
                                    Editar
                                    <Icon
                                      color={getGlobalStyle('--color-icons-primary')}
                                      icon='IconEdit'
                                      size={20}
                                    />
                                  </Button>
                                </Section>
                              )
                            }}
                          </Draggable>
                        )
                      })
                    )
                  }}
                  titles={[
                    {
                      name: '',
                      key: '',
                      justify: 'flex-start',
                      width: '10%',
                      render: () => {
                        return (
                          <Row>
                            <Divider
                              margin={5}
                              style={{
                                width: '1.5625rem'
                              }}
                            />
                            <Icon
                              color={getGlobalStyle('--color-icons-gray')}
                              icon='IconDragHandle'
                              size={20}
                            />
                          </Row>
                        )
                      }
                    },
                    {
                      name: '',
                      key: 'CheckboxCubeToMemo',
                      justify: 'flex-start',
                      width: '10%',
                      render: () => {
                        return (
                          <Row>
                            <Divider
                              margin={5}
                              style={{
                                width: '0.1375rem'
                              }}
                            />
                            <CheckboxCube
                              checked={checkAll}
                              id='all'
                              key='all'
                              name='all'
                              onChange={() => {
                                setCheckAll(!checkAll)
                                return toggleAll()
                              }}
                            />
                          </Row>
                        )
                      }
                    },
                    {
                      name: 'Nombre',
                      key: '',
                      justify: 'flex-start',
                      width: '1fr'
                    },
                    {
                      name: 'descripción',
                      justify: 'flex-center',
                      width: '1fr'
                    },
                    {
                      name: 'fecha de creación',
                      justify: 'flex-center',
                      width: '1fr'
                    },
                    {
                      name: 'Borrar',
                      justify: 'flex-center',
                      width: '1fr'
                    },
                    {
                      name: 'Acciones',
                      justify: 'flex-center',
                      width: '1fr'
                    }
                  ]}
                />
                {provided.placeholder}
              </div>
            )
          }}
        </Droppable>
      </DragDropContext>
      <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
      <Button
        disabled={checkedItems.size === 0 || roleList?.length <= 0}
        onClick={handleRemoveRoles}
        primary={true}
      >
        Eliminar roles seleccionados
      </Button>
      <Pagination
        currentPage={pagination.currentPage}
        handleNextPage={() => { return handlePageChange(pagination.currentPage + 1) }}
        handleOnClick={(pageNumber) => { return handlePageChange(pageNumber) }}
        handlePrevPage={() => { return handlePageChange(pagination.currentPage - 1) }}
        isVisableButtonLeft={pagination.currentPage > 1}
        isVisableButtonRight={pagination.currentPage < pagination.totalPages}
        isVisableButtons={pagination.totalPages > 1}
        items={Array.from({ length: pagination.totalPages }, (_, index) => { return index + 1 })}
      />
    </div>
  )
}

ListRoles.propTypes = {
  handlePageChange: PropTypes.func,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number
  }),
  roles: PropTypes.array
}
