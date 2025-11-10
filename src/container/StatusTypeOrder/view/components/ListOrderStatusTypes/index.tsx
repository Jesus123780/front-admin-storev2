import { OrderStatusTypesQueryResult } from 'npm-pkg-hook'
import {
    Button,
    Column,
    DragDropContext,
    Draggable,
    Droppable,
    getGlobalStyle,
    Icon,
    Pagination,
    Row,
    Section,
    Table,
    Text,
    ToggleSwitch
} from 'pkg-components'

import { OrderStatusType } from '@/container/orders/types'

export const ListOrderStatusTypes = ({
    data,
    handlePageChange,
}: {
    data: OrderStatusTypesQueryResult,
    handlePageChange: (pageNumber: number) => void
}) => {
    const handleOnDragEnd = () => {
    }
    const pagination = data?.getAllOrderStatusTypes?.pagination
    return (
        <Column>
            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable
                    droppableId='droppable-status-types'
                    isCombineEnabled={false}
                    ignoreContainerClipping={false}
                >
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            <Table
                                header={true}
                                pointer={true}
                                data={data?.getAllOrderStatusTypes?.data ?? []}
                                renderBody={(dataB, titles) => {
                                    return dataB?.map((x: OrderStatusType, i: number) => (
                                        <Draggable
                                            key={x.idStatus}
                                            draggableId={String(x.idStatus)}
                                            index={i}
                                        >
                                            {(provided) => (
                                                <Section
                                                    columnWidth={titles}
                                                    ref={provided.innerRef}
                                                    odd={true}
                                                    {...provided.draggableProps}
                                                >
                                                    {/* Drag handle */}
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        style={{
                                                            cursor: 'grab',
                                                            backgroundColor: getGlobalStyle('--color-base-transparent')
                                                        }}
                                                    >
                                                        <Icon
                                                            color={getGlobalStyle('--color-icons-gray')}
                                                            icon='IconDragHandle'
                                                            size={20}
                                                        />
                                                    </div>

                                                    {/* Name */}
                                                    <Column justifyContent='flex-start'>
                                                        <Text>
                                                            {x.name}
                                                        </Text>
                                                    </Column>

                                                    {/* Description */}
                                                    <Column style={{ display: 'flex', justifyContent: 'center' }}>
                                                        <Text>
                                                            {x.description}
                                                        </Text>
                                                    </Column>
                                                    <Row style={{
                                                        width: 'max-content'
                                                    }}>
                                                        <ToggleSwitch
                                                            checked={true}
                                                            id={`enable_status_type_${i}`}
                                                            label='Desactivar'
                                                            onChange={() => { }}
                                                            successColor='green'
                                                        />
                                                        <Button
                                                            border='none'
                                                            onClick={() => {
                                                                return
                                                            }}
                                                        >
                                                            <Icon
                                                                icon='IconDelete'
                                                                color={getGlobalStyle('--color-icons-primary')}
                                                                size={20}
                                                            />
                                                        </Button>
                                                        <Button
                                                            border='none'
                                                            onClick={() => {
                                                                return
                                                            }}
                                                        >
                                                            <Icon
                                                                color={getGlobalStyle('--color-icons-primary')}
                                                                icon='IconEdit'
                                                                size={20}
                                                            />
                                                        </Button>
                                                    </Row>
                                                </Section>
                                            )}
                                        </Draggable>
                                    ))
                                }}
                                titles={[
                                    {
                                        name: '',
                                        justify: 'flex-start',
                                        width: '40px' // algo fijo para el drag handle
                                    },
                                    {
                                        name: 'Nombre',
                                        justify: 'flex-start',
                                        width: 'minmax(100px, 10%)'
                                    },
                                    {
                                        name: 'Descripción',
                                        justify: 'flex-start',
                                        width: 'minmax(100px, 1fr)' // la que más espacio necesitará
                                    },
                                    {
                                        name: 'Acciones',
                                        justify: 'center',
                                        width: 'minmax(120px, min-content)' // que no se quede demasiado pequeño ni gigante
                                    }
                                ]}
                            />
                            {provided.placeholder as React.ReactNode}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
            {pagination?.totalPages !== 1 &&
                <Pagination
                    currentPage={pagination?.currentPage}
                    handleNextPage={() => { return handlePageChange(pagination?.currentPage + 1) }}
                    handleOnClick={(pageNumber: number) => { return handlePageChange(pageNumber) }}
                    handlePrevPage={() => { return handlePageChange(pagination?.currentPage - 1) }}
                    isVisableButtonLeft={pagination?.currentPage > 1}
                    isVisableButtonRight={pagination?.currentPage < pagination?.totalPages}
                    isVisableButtons={Boolean(pagination?.totalPages ?? 0 > 1)}
                    items={Array.from({ length: pagination?.totalPages ?? 0 }, (_, index) => { return index + 1 })}
                />
            }
        </Column>
    )
}
