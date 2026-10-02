'use client'

import {
    RandomCode,
    useFormTools,
    useStoreTableCreate,
    useStoreTables
} from 'npm-pkg-hook'
import {
    AlertInfo,
    Carousel,
    Column,
    Divider,
    getGlobalStyle,
    HeaderSteps,
    Icon,
    InputHooks,
    RippleButton,
    Row,
    Text
} from 'pkg-components'
import React, {
    FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react'

import { Context } from '../../../context/Context'
import { TableSetting } from '../TableSetting'
import styles from './style.module.css'
import { QuantityButtonFloat } from 'pkg-components/stories/molecules/QuantityButtonFloat'

const MIN_SEATS = 1
const MAX_SEATS = 30

const SEAT_PRESETS = [
    1,
    2,
    4,
    6,
    8,
    10,
    12,
    14,
    16,
    20,
    24,
    30
]

interface StoreTable {
    seats?: number | string
    section?: string
    tableName?: string
    name?: string
}

interface SeatPresetProps {
    value: number
    selected: boolean
    onClick: () => void
}

interface EmptyStateProps {
    onCreate: () => void
}

/**
 * Limits a seat value between the allowed minimum and maximum.
 *
 * @param {number} value - Value to limit.
 * @returns {number} Normalized seat count.
 */
const clampSeats = (
    value: number
): number => {
    if (!Number.isFinite(value)) {
        return MIN_SEATS
    }

    return Math.max(
        MIN_SEATS,
        Math.min(
            MAX_SEATS,
            Math.trunc(value)
        )
    )
}

/**
 * Returns a formatted seat label.
 *
 * @param {number} seats - Seat count.
 * @returns {string} Formatted label.
 */
const getSeatLabel = (
    seats: number
): string => {
    return `${seats} ${seats === 1
        ? 'asiento'
        : 'asientos'
        }`
}

/**
 * Seat preset button used inside the carousel.
 *
 * @param {SeatPresetProps} props - Component props.
 * @returns {JSX.Element} Seat preset.
 */
const SeatPreset = ({
    value,
    selected,
    onClick
}: SeatPresetProps): JSX.Element => {
    return (
        <li className={styles.seatItem}>
            <button
                aria-pressed={selected}
                className={`${styles.seatOption} ${selected
                    ? styles.seatOptionActive
                    : ''
                    }`}
                onClick={onClick}
                type='button'
            >
                <span
                    className={
                        styles.seatOptionIcon
                    }
                >
                    <Icon
                        icon='IconChair'
                        size={50}
                    />
                </span>

                <span
                    className={
                        styles.seatOptionContent
                    }
                >
                    <strong>
                        {value}
                    </strong>

                    <span>
                        {value === 1
                            ? 'asiento'
                            : 'asientos'}
                    </span>
                </span>

                {selected && (
                    <Column className={styles.selected}>
                        <Icon
                            icon='IconMiniCheck'
                            size={15}
                            color={getGlobalStyle('--color-icons-white')}
                        />
                    </Column>
                )}
            </button>
        </li>
    )
}

/**
 * Empty state displayed when no tables exist.
 *
 * @param {EmptyStateProps} props - Component props.
 * @returns {JSX.Element} Empty state.
 */
const EmptyState = ({
    onCreate
}: EmptyStateProps): JSX.Element => {
    return (
        <div className={styles.emptyState}>
            <div
                className={
                    styles.emptyStateIcon
                }
            >
                <Icon
                    icon='IconChair'
                    size={50}
                />
            </div>

            <Text
                size='xl'
                weight='bold'
            >
                Aún no tienes mesas
            </Text>

            <Text
                size='sm'
                style={{
                    maxWidth: 430,
                    textAlign: 'center',
                    color:
                        'var(--color-neutral-gray-dark)'
                }}
            >
                Crea tu primera mesa,
                define la cantidad de
                asientos y visualiza
                cómo quedará organizada
                en tu comercio.
            </Text>

            <RippleButton
                onClick={onCreate}
            >
                Crear primera mesa
            </RippleButton>
        </div>
    )
}

/**
 * Loading skeleton for the table list.
 *
 * @returns {JSX.Element} Skeleton grid.
 */
const TableListSkeleton =
    (): JSX.Element => {
        return (
            <div
                className={
                    styles.tablesGrid
                }
            >
                {Array.from({
                    length: 4
                }).map((_, index) => (
                    <div
                        className={
                            styles.tableCard
                        }
                        key={`table-skeleton-${index}`}
                    >
                        <div
                            className={
                                styles.tableCardHeader
                            }
                        >
                            <span
                                className={
                                    styles.skeletonLine
                                }
                            />

                            <span
                                className={
                                    styles.skeletonPill
                                }
                            />
                        </div>

                        <div
                            className={
                                styles.skeletonTable
                            }
                        />

                        <div
                            className={
                                styles.tableCardFooter
                            }
                        >
                            <span
                                className={
                                    styles.skeletonLineSmall
                                }
                            />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

/**
 * Main table seating management component.
 *
 * @returns {JSX.Element} Table management UI.
 */
export const TableSeating =
    (): JSX.Element => {
        const {
            sendNotification
        } = React.useContext(
            Context
        )

        const [
            selectedSeats,
            setSelectedSeats
        ] = useState<number>(4)

        const [
            handleChange,
            handleSubmit,
            setDataValue,
            {
                dataForm,
                errorForm
            }
        ] =
            useFormTools({
                sendNotification
            })

        const [
            storeTableCreate,
            {
                loading
            }
        ] =
            useStoreTableCreate({
                sendNotification
            })

        const [
            data,
            {
                loading:
                loadingData
            }
        ] =
            useStoreTables()

        const [
            active,
            setActive
        ] = useState<number>(0)

        const [
            overActive,
            setOverActive
        ] = useState<boolean>(false)

        const hasInitializedForm =
            useRef<boolean>(false)

        /**
         * Initializes the form once with
         * a generated table name.
         */
        useEffect(() => {
            if (
                hasInitializedForm.current
            ) {
                return
            }

            hasInitializedForm.current =
                true

            const generatedName =
                RandomCode(10)

            const currentTableName =
                typeof dataForm?.tableName ===
                    'string' &&
                    dataForm.tableName.trim()
                    ? dataForm.tableName
                    : generatedName

            setDataValue({
                ...dataForm,
                tableName:
                    currentTableName,
                oldTableName:
                    currentTableName
            })
        }, [
            dataForm,
            setDataValue
        ])

        const storeTables =
            useMemo<StoreTable[]>(
                () => {
                    if (
                        !Array.isArray(
                            data?.storeTables
                        )
                    ) {
                        return []
                    }

                    return data.storeTables
                        .filter(Boolean)
                        .map(
                            (
                                table: StoreTable
                            ) => table
                        )
                },
                [data]
            )

        const tableCount =
            storeTables.length

        const steps =
            useMemo(
                () => [
                    'CREA UNA MESA PARA TU COMERCIO',
                    `MESAS CREADAS (${tableCount})`
                ],
                [tableCount]
            )

        const breakpoints =
            useMemo(
                () => ({
                    575: {
                        slidesPerView: 2,
                        spaceBetween: 8
                    },
                    767: {
                        slidesPerView: 3,
                        spaceBetween: 10
                    },
                    991: {
                        slidesPerView: 4,
                        spaceBetween: 12
                    },
                    1199: {
                        slidesPerView: 5,
                        spaceBetween: 14
                    }
                }),
                []
            )

        /**
         * Changes selected seat count.
         *
         * @param {number} seats - Number of seats.
         * @returns {void}
         */
        const handleSeatSelection =
            useCallback(
                (
                    seats: number
                ): void => {
                    setSelectedSeats(
                        clampSeats(seats)
                    )
                },
                []
            )

        /**
         * Decreases selected seat count.
         *
         * @returns {void}
         */
        const handleDecreaseSeats =
            useCallback(
                (): void => {
                    setSelectedSeats(
                        previous =>
                            clampSeats(
                                previous - 1
                            )
                    )
                },
                []
            )

        /**
         * Increases selected seat count.
         *
         * @returns {void}
         */
        const handleIncreaseSeats =
            useCallback(
                (): void => {
                    setSelectedSeats(
                        previous =>
                            clampSeats(
                                previous + 1
                            )
                    )
                },
                []
            )

        /**
         * Handles quantity changes emitted by
         * QuantityButtonFloat.
         *
         * @param {unknown} event - Quantity change event.
         * @returns {void}
         */
        const handleQuantityChange =
            useCallback(
                (
                    event: unknown
                ): void => {
                    if (
                        event == null
                    ) {
                        return
                    }

                    /**
                     * QuantityButtonFloat normally
                     * provides an input-like event.
                     */
                    const target =
                        (
                            event as {
                                target?: {
                                    value?: unknown
                                }
                            }
                        )?.target

                    const rawValue =
                        target?.value

                    const parsedValue =
                        Number(rawValue)

                    if (
                        !Number.isFinite(
                            parsedValue
                        )
                    ) {
                        return
                    }

                    setSelectedSeats(
                        clampSeats(
                            parsedValue
                        )
                    )
                },
                []
            )

        /**
         * Toggles HeaderSteps overflow state.
         *
         * @returns {void}
         */
        const handleOverActive =
            useCallback(
                (): void => {
                    setOverActive(
                        previous =>
                            !previous
                    )
                },
                []
            )

        /**
         * Handles table creation.
         *
         * @param {FormEvent<HTMLFormElement>} event - Submit event.
         * @returns {unknown} Form submission result.
         */
        const handleForm =
            useCallback(
                (
                    event: FormEvent<HTMLFormElement>
                ) => {
                    const generatedName =
                        RandomCode(10)

                    const tableName =
                        typeof dataForm?.tableName ===
                            'string' &&
                            dataForm.tableName.trim()
                            ? dataForm.tableName.trim()
                            : generatedName

                    const section =
                        typeof dataForm?.section ===
                            'string'
                            ? dataForm.section.trim()
                            : ''

                    return handleSubmit({
                        event,
                        action:
                            async (): Promise<void> => {
                                await storeTableCreate(
                                    tableName,
                                    selectedSeats,
                                    section,
                                    1
                                )

                                setActive(1)

                                const nextTableName =
                                    RandomCode(10)

                                setDataValue({
                                    ...dataForm,
                                    tableName:
                                        nextTableName,
                                    oldTableName:
                                        nextTableName
                                })
                            }
                    })
                },
                [
                    dataForm,
                    handleSubmit,
                    selectedSeats,
                    setDataValue,
                    storeTableCreate
                ]
            )

        const currentTableName =
            typeof dataForm?.tableName ===
                'string' &&
                dataForm.tableName.trim()
                ? dataForm.tableName
                : 'Mesa nueva'

        return (
            <div
                className={
                    styles.wrapper
                }
            >
                <div
                    className={
                        styles.stickyHeader
                    }
                >
                    <HeaderSteps
                        active={active}
                        handleOverActive={
                            handleOverActive
                        }
                        overActive={
                            overActive
                        }
                        setActive={
                            setActive
                        }
                        steps={steps}
                        style={{
                            marginBottom: 0
                        }}
                    />

                    <div
                        className={
                            styles.stepContext
                        }
                    >
                        <Column>
                            <Text
                                size='md'
                                weight='bold'
                            >
                                {active === 0
                                    ? 'Configura tu mesa'
                                    : 'Gestiona tus mesas'}
                            </Text>

                            <Text
                                size='xs'
                                style={{
                                    color:
                                        'var(--color-neutral-gray-dark)'
                                }}
                            >
                                {active === 0
                                    ? 'Define el nombre y la cantidad de asientos antes de crearla.'
                                    : `${tableCount} ${tableCount === 1
                                        ? 'mesa disponible'
                                        : 'mesas disponibles'
                                    } en tu comercio.`}
                            </Text>
                        </Column>

                        <div
                            className={
                                styles.countBadge
                            }
                        >
                            <strong>
                                {tableCount}
                            </strong>

                            <span>
                                mesas
                            </span>
                        </div>
                    </div>
                </div>

                {active === 0 ? (
                    <div
                        className={
                            styles.createLayout
                        }
                    >
                        <section
                            className={
                                styles.formCard
                            }
                        >
                            <div
                                className={
                                    styles.cardHeader
                                }
                            >
                                <div
                                    className={
                                        styles.cardHeaderIcon
                                    }
                                >
                                    <Icon
                                        icon='IconChair'
                                        size={80}
                                    />
                                </div>

                                <Column>
                                    <Text
                                        size='xl'
                                        weight='bold'
                                    >
                                        Nueva mesa
                                    </Text>

                                    <Text
                                        size='sm'
                                        style={{
                                            color:
                                                'var(--color-neutral-gray-dark)'
                                        }}
                                    >
                                        Personaliza la mesa
                                        para tu comercio.
                                    </Text>
                                </Column>
                            </div>

                            <Divider
                                marginBottom={
                                    getGlobalStyle(
                                        '--spacing-2xl'
                                    )
                                }
                            />

                            <Column
                                as='form'
                                justifyContent='center'
                                onSubmit={handleForm}
                            >
                                <Column
                                    style={{
                                        padding: getGlobalStyle('--spacing-xl')
                                    }}
                                    className={
                                        styles.fieldGroup
                                    }
                                >
                                    <Text
                                        size='sm'
                                        weight='semibold'
                                    >
                                        Información
                                    </Text>

                                    <Text
                                        size='xs'
                                        styles={{
                                            color:
                                                'var(--color-neutral-gray-dark)'
                                        }}
                                    >
                                        El nombre aparecerá
                                        asociado a esta
                                        mesa.
                                    </Text>

                                    <InputHooks
                                        error={
                                            errorForm?.tableName
                                        }
                                        margin='none'
                                        marginBottom={
                                            getGlobalStyle(
                                                '--spacing-lg'
                                            )
                                        }
                                        name='tableName'
                                        onChange={
                                            handleChange
                                        }
                                        placeholder={
                                            dataForm?.oldTableName
                                        }
                                        required={true}
                                        title='Nombre de la mesa'
                                        value={
                                            dataForm?.tableName ||
                                            ''
                                        }
                                        width='100%'
                                    />
                                    <InputHooks
                                        error={
                                            errorForm?.section
                                        }
                                        margin='none'
                                        marginBottom={
                                            getGlobalStyle(
                                                '--spacing-2xl'
                                            )
                                        }
                                        name='section'
                                        onChange={
                                            handleChange
                                        }
                                        title='Sección'
                                        value={
                                            dataForm?.section ||
                                            ''
                                        }
                                        width='100%'
                                    />
                                </Column>
                                <Column
                                    className={
                                        styles.formAction
                                    }
                                >
                                    <Column>
                                        <Text
                                            size='xs'
                                            weight='semibold'
                                        >
                                            Mesa que estás
                                            configurando
                                        </Text>

                                        <Text
                                            size='sm'
                                            style={{
                                                color:
                                                    'var(--color-primary-red)',
                                                fontWeight:
                                                    700
                                            }}
                                        >
                                            {currentTableName}
                                        </Text>
                                    </Column>

                                    <RippleButton
                                        loading={
                                            loading
                                        }
                                        type='submit'
                                    >
                                        Crear mesa
                                    </RippleButton>
                                </Column>
                            </Column>
                        </section>

                        <section
                            className={
                                styles.previewCard
                            }
                        >
                            <div
                                className={
                                    styles.cardHeader
                                }
                            >
                                <Column>
                                    <Text
                                        size='xl'
                                        weight='bold'
                                    >
                                        Distribución de
                                        asientos
                                    </Text>

                                    <Text
                                        size='sm'
                                        styles={{
                                            color:
                                                'var(--color-neutral-gray-dark)'
                                        }}
                                    >
                                        La vista se actualiza
                                        automáticamente.
                                    </Text>
                                </Column>

                                <div
                                    className={
                                        styles.previewCount
                                    }
                                >
                                    <strong>
                                        {selectedSeats}
                                    </strong>

                                    <span>
                                        {selectedSeats ===
                                            1
                                            ? 'asiento'
                                            : 'asientos'}
                                    </span>
                                </div>
                            </div>

                            <div
                                className={
                                    styles.selectorSection
                                }
                            >
                                <div
                                    className={
                                        styles.selectorTitle
                                    }
                                >
                                    <Text
                                        size='sm'
                                        weight='semibold'
                                    >
                                        Selecciona una
                                        capacidad
                                    </Text>

                                    <Text
                                        size='xs'
                                        styles={{
                                            color:
                                                'var(--color-neutral-gray-dark)'
                                        }}
                                    >
                                        Opciones rápidas
                                    </Text>
                                </div>

                                <ul
                                    className={
                                        styles.seatList
                                    }
                                >
                                    <Carousel
                                        breakpoints={
                                            breakpoints
                                        }
                                        pagination={false}
                                    >
                                        {SEAT_PRESETS.map(
                                            seatsOption => (
                                                <SeatPreset
                                                    key={`seat-option-${seatsOption}`}
                                                    onClick={() =>
                                                        handleSeatSelection(
                                                            seatsOption
                                                        )
                                                    }
                                                    selected={
                                                        selectedSeats ===
                                                        seatsOption
                                                    }
                                                    value={
                                                        seatsOption
                                                    }
                                                />
                                            )
                                        )}
                                    </Carousel>
                                </ul>

                                <div
                                    className={
                                        styles.customSelector
                                    }
                                >
                                    <Column>
                                        <Text
                                            size='sm'
                                            weight='semibold'
                                        >
                                            Cantidad exacta
                                        </Text>

                                        <Text
                                            size='xs'
                                            style={{
                                                color:
                                                    'var(--color-neutral-gray-dark)'
                                            }}
                                        >
                                            Entre {MIN_SEATS}{' '}
                                            y {MAX_SEATS}{' '}
                                            puestos
                                        </Text>
                                    </Column>
                                    <Column style={{
                                        position: 'relative',
                                        width: 'fit-content'
                                    }}>
                                        <QuantityButtonFloat
                                            handleIncrement={
                                                () => {
                                                    handleIncreaseSeats()
                                                }
                                            }
                                            handleDecrement={
                                                () => {
                                                    handleDecreaseSeats()
                                                }
                                            }
                                            handleChangeQuantity={
                                                handleQuantityChange
                                            }
                                            open={true}
                                            editable={false}
                                            editing={true}
                                            quantity={
                                                selectedSeats
                                            }
                                        />
                                    </Column>

                                </div>
                            </div>

                            <div
                                className={
                                    styles.previewStage
                                }
                            >
                                <div
                                    className={
                                        styles.previewLabel
                                    }
                                >
                                    <span>
                                        Vista previa
                                    </span>

                                    <span>
                                        {getSeatLabel(
                                            selectedSeats
                                        )}
                                    </span>
                                </div>

                                <TableSetting
                                    list={
                                        SEAT_PRESETS
                                    }
                                    loading={false}
                                    number={
                                        selectedSeats
                                    }
                                />
                            </div>

                            <AlertInfo
                                message='Puedes cambiar la cantidad de asientos antes de crear la mesa. Después de crearla, la mesa no puede eliminarse.'
                                type='warning'
                            />
                        </section>
                    </div>
                ) : (
                    <section
                        className={
                            styles.listSection
                        }
                    >
                        <Column
                            className={
                                styles.listToolbar
                            }
                        >
                            <Column>
                                <Text
                                    size='xl'
                                    weight='bold'
                                >
                                    Mesas de tu comercio
                                </Text>

                                <Text
                                    size='sm'
                                    style={{
                                        color:
                                            'var(--color-neutral-gray-dark)'
                                    }}
                                >
                                    Revisa visualmente la
                                    capacidad de cada mesa.
                                </Text>
                            </Column>

                            <RippleButton
                                onClick={() => {
                                    setActive(0)
                                }}
                            >
                                Crear otra mesa
                            </RippleButton>
                        </Column>

                        {loadingData ? (
                            <TableListSkeleton />
                        ) : tableCount === 0 ? (
                            <EmptyState
                                onCreate={() => {
                                    setActive(0)
                                }}
                            />
                        ) : (
                            <div
                                className={
                                    styles.tablesGrid
                                }
                            >
                                {storeTables.map(
                                    (
                                        table,
                                        index
                                    ) => {
                                        const seats =
                                            clampSeats(
                                                Number(
                                                    table?.seats
                                                ) || 1
                                            )

                                        const section =
                                            typeof table?.section ===
                                                'string' &&
                                                table.section.trim()
                                                ? table.section
                                                : ''

                                        const tableName =
                                            typeof table?.tableName ===
                                                'string' &&
                                                table.tableName.trim()
                                                ? table.tableName
                                                : typeof table?.name ===
                                                    'string' &&
                                                    table.name.trim()
                                                    ? table.name
                                                    : `Mesa ${index + 1
                                                    }`

                                        return (
                                            <article
                                                className={
                                                    styles.tableCard
                                                }
                                                key={`store-table-${index}-${tableName}`}
                                            >
                                                <div
                                                    className={
                                                        styles.tableCardHeader
                                                    }
                                                >
                                                    <div>
                                                        <Text
                                                            size='lg'
                                                            weight='bold'
                                                        >
                                                            {tableName}
                                                        </Text>

                                                        {section && (
                                                            <Text
                                                                size='xs'
                                                                style={{
                                                                    color:
                                                                        'var(--color-neutral-gray-dark)'
                                                                }}
                                                            >
                                                                {section}
                                                            </Text>
                                                        )}
                                                    </div>

                                                    <div
                                                        className={
                                                            styles.tableCapacity
                                                        }
                                                    >
                                                        {getSeatLabel(
                                                            seats
                                                        )}
                                                    </div>
                                                </div>

                                                <div
                                                    className={
                                                        styles.tableVisual
                                                    }
                                                >
                                                    <TableSetting
                                                        index={
                                                            index
                                                        }
                                                        list={
                                                            SEAT_PRESETS
                                                        }
                                                        loading={
                                                            loadingData
                                                        }
                                                        number={
                                                            seats
                                                        }
                                                    />
                                                </div>

                                                <div
                                                    className={
                                                        styles.tableCardFooter
                                                    }
                                                >
                                                    <span>
                                                        Mesa #
                                                        {index +
                                                            1}
                                                    </span>

                                                    <span>
                                                        Capacidad:
                                                        {' '}
                                                        {seats}
                                                    </span>
                                                </div>
                                            </article>
                                        )
                                    }
                                )}
                            </div>
                        )}
                    </section>
                )}
            </div>
        )
    }