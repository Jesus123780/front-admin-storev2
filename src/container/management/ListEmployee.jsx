'use client'

import PropTypes from 'prop-types'
import { 
  CheckboxCube,
  Column, 
  Divider, 
  DragDropContext, 
  Draggable, 
  Droppable, 
  getGlobalStyle, 
  Icon, 
  Pagination, 
  Row, 
  Section, 
  Table,
  Tag
} from 'pkg-components'
import React, { useEffect, useState } from 'react'
import { useEmployee, useCheckboxState } from 'npm-pkg-hook'

export const ListEmployee = ({
  handlePageChange = () => { return null }
}) => {
  const [data, { pagination }] = useEmployee()
  const [employee, setEmployee] = useState([])
  const roleIds = employee.map(role => {return role.eId})
  const [checkAll, setCheckAll] = useState(false)

  const { 
    checkedItems, 
    disabledItems, 
    handleChangeCheck, 
    toggleAll
  } = useCheckboxState(roleIds, [])

  const handleOnDragEnd = (result) => {
    if (!result.destination) return
  
    // Crear una copia de la lista de roles
    const reorderedItems = Array.from(employee)
    const [movedItem] = reorderedItems.splice(result.source.index, 1)
    reorderedItems.splice(result.destination.index, 0, movedItem)
  
    // Actualizar prioridades para que sean únicas y secuenciales
    const updatedItems = reorderedItems.map((item, index) => {return {
      ...item,
      priority: index + 1
    }})
  
    // Actualizar el estado con los ítems reorganizados
    setEmployee(updatedItems)
    const updatedItemsDb = reorderedItems.map((item, index) => {
      return {
        eId: item.eId ?? null,
        priority: index + 1
      }})
    // handleUpdateRolesPriority(updatedItemsDb)
  }
  const getItemStyle = (isDragging, draggableStyle) => {
    return {
      userSelect: 'none',
      padding: 16,
      backgroundColor: isDragging && getGlobalStyle('--color-background-gray-light'),
      ...draggableStyle
    }
  }

  // EFFECTS
  // useEffect(() => { setEmployee(data) }, [data])
  const bgColor = {
    INACTIVE: getGlobalStyle('--color-feedback-warning-light'),
    ACTIVE: getGlobalStyle('--color-feedback-success-light')
  }
  const color = {
    INACTIVE: getGlobalStyle('--color-neutral-white'),
    ACTIVE:  getGlobalStyle('--color-neutral-white')
  }
  const statusOrder = {
    'INACTIVE': 'PENDIENTE',
    'ACTIVE': 'ACTIVE'
  }

  return (
    <Column
    >
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId='droppable_employee'>
          {(provided) => {return (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <Table
                data={data}
                renderBody={(data, titles) => {return (
                  data.map((role, index) => {
                    const { 
                      status,
                      eId,
                      user = {
                        name: '',
                        email: ''
                      }
                    } = role
                    return (
                      <Draggable
                        draggableId={`${eId}`}
                        index={index}
                        key={eId}
                      >
                        {(provided, snapshot) => {return (
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
                                checked={checkedItems.has(eId)}
                                disabled={disabledItems.has(eId)}
                                id={eId}
                                onChange={(e) => {
                                  return handleChangeCheck(e, eId)
                                }}
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                              <span>{`${user?.name ?? ''} USUARIO INVITADO`}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                              <span>{`${user?.email ?? ''}`}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <Tag
                                label={statusOrder[status]}
                                style={{
                                  borderRadius: '6px',
                                  padding: '15px',
                                  backgroundColor: bgColor[status],
                                  color: color[status]
                                }}
                              >
                              </Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <button
                                onClick={() => {
                                  // removeRoles({roleIds : [eId] })
                                  // setEmployee(prevState => {return prevState.filter(role => {return role.eId !== eId })})
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
                          </Section>
                        )}}
                      </Draggable>
                    )
                  })
                )}}
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
                      )}
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
                      )}
                  },
                  { 
                    name: 'Nombre', 
                    key: '', 
                    justify: 'flex-start', 
                    width: '1fr'
                  },
                  { 
                    name: 'Correo', 
                    key: '', 
                    justify: 'flex-start', 
                    width: '1fr'
                  },
                  { 
                    name: 'Estado', 
                    key: 'status', 
                    arrow: true,
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
          )}}
        </Droppable>
      </DragDropContext>
      {pagination?.totalPages !== 1 && <Pagination
        currentPage={pagination?.currentPage}
        handleNextPage={() => { return handlePageChange(pagination?.currentPage + 1) }}
        handleOnClick={(pageNumber) => { return handlePageChange(pageNumber) }}
        handlePrevPage={() => { return handlePageChange(pagination?.currentPage - 1) }}
        isVisableButtonLeft={pagination?.currentPage > 1}
        isVisableButtonRight={pagination?.currentPage < pagination?.totalPages}
        isVisableButtons={Boolean(pagination?.totalPages ?? 0 > 1)}
        items={Array.from({ length: pagination?.totalPages ?? 0 }, (_, index) => { return index + 1 })}
      />}
    </Column>
  )
}

ListEmployee.propTypes = {
  handlePageChange: PropTypes.func
}
