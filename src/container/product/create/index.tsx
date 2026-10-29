'use client'

import {
    usePathname,
    useRouter,
    useSearchParams
} from 'next/navigation'
import {
    timeSuggestions,
    useDessert,
    useDessertWithPrice,
    useGetOneProductsFood,
    useLogout,
    useManageQueryParams,
    useSaveAvailableProduct,
    useStore
} from 'npm-pkg-hook'
import {
    AwesomeModal,
    Button,
    Checkbox,
    Column,
    DaySelector,
    Divider,
    getGlobalStyle,
    HeaderSteps,
    Icon,
    ImageProductEdit,
    InputTags,
    Loading,
    MemoCardProductSimple,
    OptionalExtraProducts,
    Row,
    Tag,
    Text
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React, {
    memo,
    useContext,
    useEffect,
    useState
} from 'react'

import { Context } from '../../../context/Context'
import { filterKeyObject } from '../../../utils'
import { Categories } from '../../categories'
import { ExtrasProductsItems } from '../extras/ExtrasProductsItems'
import { FormProduct } from './Form'
import { productSchema } from './schema/producSchema'
import styles from './styles.module.css'
import { FoodComponentMemoProps } from './types'

const titleHeaders = [
    'DETALLES',
    'ADICIONALES',
    'COMPLEMENTOS',
    'DISPONIBILIDAD'
]

interface DayConfig {
    startTime: string
    endTime: string
}

interface AvailabilityCheck {
    availability: boolean
    noAvailability: boolean
}

/**
 * FoodComponentMemo manages the product creation and editing workflow.
 *
 * @param {FoodComponentMemoProps} props - Product form configuration and handlers.
 * @returns {JSX.Element} Product management interface.
 */
export const FoodComponentMemo: React.FC<FoodComponentMemoProps> = ({
    active,
    check,
    checkStock,
    data,
    dataCategoriesProducts,
    dataFree,
    errors,
    image,
    loading,
    names,
    pId,
    propsImageEdit,
    search,
    showMore,
    state: grid,
    STEPS,
    stock,
    tagsProps,
    values = {
        carProId: '',
        ProDescription: '',
        ProDescuento: '',
        ProPrice: 0,
        ValueDelivery: ''
    },
    fetchMore,
    handleChange,
    handleChangeFilter,
    handleCheck,
    handleCheckFreeShipping,
    handleCheckStock,
    handleClick,
    handleDecreaseStock = () => {},
    handleDelete,
    handleIncreaseStock = () => {},
    handleRegister,
    onClickClear,
    setActive,
    setCheck: setCheckAvailableDays,
    setErrors,
    setName,
    setShowComponentModal,
    setShowMore,
    ...props
}) => {
    // Hooks
    const router = useRouter()
    const location = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()

    const { onClickLogout } = useLogout({})

    const { getQuery } = useManageQueryParams({
        router: location,
        searchParams
    })

    const { handleQuery, handleCleanQuery } = useManageQueryParams({
        router,
        searchParams
    })

    const { setAlertBox, sendNotification } = useContext(Context)

    const [dataStore] = useStore()
    const { idStore } = dataStore ?? {}

    const food = getQuery('food')

    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const [openAlertClose, setOpenAlertClose] = useState(false)
    const [openModalDessert, setOpenModalDessert] = useState(true)

    const [dayConfigs, setDayConfigs] = useState<
        Record<number, DayConfig>
    >({})

    const {
        dataTags,
        handleAddTag,
        handleRemoveTag,
        setNewTags,
        newTags,
        loadingTags,
        registerTags,
        tags
    } = tagsProps ?? {
        dataTags: [],
        handleAddTag: () => false,
        handleRemoveTag: () => {},
        setNewTags: () => {},
        newTags: [],
        loadingTags: false,
        registerTags: () => {},
        tags: {
            tag: ''
        }
    }

    const {
        handleDaySelection,
        registerAvailableProduct,
        selectedDays,
        handleCleanSelectedDays,
        loading: loaAvailable,
        days
    } = useSaveAvailableProduct()

    const {
        handleCheck: handleCheckDessert,
        handleRemoveList,
        setTitle,
        loadingCreateSubDessert,
        title,
        setCheck,
        dataListIds,
        data: dataLines,
        handleChangeItems,
        handleAdd,
        isCompleteRequired,
        removeOneItem,
        handleAddList,
        handleCleanData,
        setData
    } = useDessert({
        pId,
        initialData: null,
        sendNotification
    })

    const {
        preview,
        inputRef,
        onFileChange,
        validTypes
    } = propsImageEdit ?? {}

    const handleOpenModalDessert = () => {
        setOpenModalDessert((previous) => !previous)
    }

    const handleOpenCloseAlert = () => {
        setOpenAlertClose((previous) => !previous)
    }

    /**
     * Closes the product workflow and clears its query parameters.
     *
     * @returns {void}
     */
    const cancelAll = () => {
        setShowComponentModal(false)
        handleClick(false)
        setActive(STEPS.PRODUCT)
        handleCleanQuery('food')
        handleCleanQuery('product')
    }

    /**
     * Opens or closes the category selector.
     *
     * @returns {void}
     */
    const handleShowCategories = () => {
        setShowCategoryModal((previous) => !previous)
    }

    /**
     * Updates the start or end time for a specific day.
     *
     * @param {number} day - Day identifier.
     * @param {'startTime' | 'endTime'} field - Time field to update.
     * @param {string} value - Selected time.
     * @returns {void}
     */
    const handleChangeAvailability = (
        day: number,
        field: 'startTime' | 'endTime',
        value: string
    ) => {
        setDayConfigs((previous) => ({
            ...previous,
            [day]: {
                startTime: previous[day]?.startTime ?? '',
                endTime: previous[day]?.endTime ?? '',
                [field]: value
            }
        }))
    }

    /**
     * Updates the mutually exclusive availability settings.
     *
     * @param {'availability' | 'noAvailability'} selectedOption - Selected setting.
     * @param {boolean} checked - Whether the option is selected.
     * @returns {void}
     */
    const handleAvailabilityChange = (
        selectedOption: keyof AvailabilityCheck,
        checked: boolean
    ) => {
        const nextState: AvailabilityCheck = {
            availability: false,
            noAvailability: false
        }

        if (checked) {
            nextState[selectedOption] = true
        }

        setCheckAvailableDays(nextState)
    }

    // Product form props
    const propsForm = {
        handleRegister,
        setName,
        names,
        handleCheckStock,
        checkStock,
        check,
        handleChange,
        values,
        dataCategoriesProducts,
        handleCheckFreeShipping,
        handleDecreaseStock,
        handleIncreaseStock,
        stock,
        image,
        errors,
        handleShowCategories,
        ...props
    }

    // Product listing props
    const propsListProducts = {
        onClickClear,
        data,
        dataFree,
        filter: true,
        organice: true,
        handleChangeFilter,
        grid,
        search,
        showMore,
        fetchMore,
        loading,
        setShowMore,
        pState: 1,
        handleDelete,
        ...props
    }

    // Additional products
    const [handleGetOneProduct, { dataExtra }] =
        useGetOneProductsFood({
            fetchOnlyProduct: false
        })

    const {
        handleAdd: handleAddExtra,
        handleRemove,
        handleSubmit: onSubmitUpdate,
        handleLineChange,
        loading: l,
        handleFocusChange,
        handleEdit,
        setLine,
        selected,
        handleSelect,
        LineItems,
        inputRefs,
        handleCleanLines: CleanLines
    } = useDessertWithPrice({
        sendNotification,
        setAlertBox,
        dataExtra
    })

    const propsExtra = {
        handleAdd: handleAddExtra,
        handleRemove,
        onSubmitUpdate,
        inputRefs,
        handleSelect,
        handleEdit,
        handleLineChange,
        selected,
        pId,
        loading: l,
        setModal: handleOpenModalDessert,
        modal: openModalDessert,
        handleFocusChange,
        setLine,
        LineItems,
        handleCleanLines: CleanLines
    }

    /**
     * Loads the product associated with the current workflow.
     *
     * @returns {Promise<void | unknown>} Product loading result.
     */
    const handlerCreateDessert = async () => {
        if (!pId || !food) {
            setShowComponentModal(false)
            handleClick(false)

            return sendNotification({
                description: 'Lo sentimos, no encontramos tu producto.',
                title: 'Error',
                backgroundColor: 'error'
            })
        }

        setActive((previous) => previous + 1)
        setOpenModalDessert(true)

        return handleGetOneProduct({
            pId: pId ?? food
        })
    }

    /**
     * Creates the input expected by the availability mutation.
     *
     * @returns {Array<{
     *   idStore: typeof idStore,
     *   pId: typeof pId,
     *   dayAvailable: number,
     *   startDate: string | undefined,
     *   endDate: string | undefined
     * }>} Availability entries.
     */
    const createFormInput = () => {
        return selectedDays.map((day: number) => ({
            idStore,
            pId: pId || food,
            dayAvailable: day,
            startDate: dayConfigs[day]?.startTime,
            endDate: dayConfigs[day]?.endTime
        }))
    }

    /**
     * Sends the availability mutation and handles its response.
     *
     * @param {ReturnType<typeof createFormInput>} input - Availability entries.
     * @returns {Promise<void>} Mutation result handling.
     */
    const handleRegisterAvailableProduct = async (
        input: ReturnType<typeof createFormInput>
    ): Promise<void> => {
        try {
            const response = await registerAvailableProduct({
                variables: { input }
            })

            const result = response?.data?.registerAvailableProduct

            if (result?.success) {
                sendSuccessNotification()

                sendNotification({
                    description: result.message,
                    title: 'Éxito',
                    backgroundColor: 'success'
                })

                return
            }

            const message =
                result?.message ??
                'Ha ocurrido un error al guardar los días disponibles.'

            sendNotification({
                description: message,
                title: 'Error',
                backgroundColor: 'error'
            })

            if (message === 'Session expired') {
                await onClickLogout({ redirect: true })

                setAlertBox({
                    message:
                        'La sesión ha expirado, por favor vuelve a iniciar sesión.'
                })
            }
        } catch {
            sendNotification({
                description:
                    'No fue posible guardar la disponibilidad. Intenta nuevamente.',
                title: 'Error',
                backgroundColor: 'error'
            })
        }
    }

    /**
     * Resets the form after successfully saving the product.
     *
     * @returns {void}
     */
    const sendSuccessNotification = () => {
        setShowComponentModal(false)
        handleClick(false)
        setActive(0)
        handleCleanSelectedDays()

        setCheckAvailableDays({
            availability: true,
            noAvailability: false
        })

        setDayConfigs({})
        handleCleanData({})

        setErrors({
            ProDescription: false,
            ProDescuento: false,
            ProPrice: false,
            ValueDelivery: false,
            carProId: false,
            names: ''
        })
    }

    /**
     * Processes the current workflow step.
     *
     * @returns {Promise<void>} Current step execution.
     */
    const handlerSteps = async (): Promise<void> => {
        // Step 1: Product details
        if (active === STEPS.PRODUCT) {
            const response = await handleRegister()
            const result = response?.data?.updateProductFoods

            if (result?.success) {
                sendNotification({
                    backgroundColor: 'success',
                    title: 'Éxito',
                    description: result.message
                })

                const productId = result?.data?.pId

                if (productId) {
                    handleQuery('food', productId)
                }

                setActive(STEPS.DESSERTS)
                return
            }

            result?.errors?.forEach((error) => {
                sendNotification({
                    backgroundColor: 'error',
                    title: 'Error',
                    description:
                        error.messag ??
                        'No fue posible guardar los datos del producto.'
                })
            })

            return
        }

        // Step 2: Optional products
        if (active === STEPS.DESSERTS) {
            if (!isCompleteRequired) {
                sendNotification({
                    backgroundColor: 'warning',
                    title: 'Alerta',
                    description: 'Completa los campos requeridos.'
                })

                return
            }

            if (food) {
                setActive(STEPS.COMPLEMENTS)
            }

            return
        }

        // Step 3: Complements
        if (active === STEPS.COMPLEMENTS) {
            setActive(STEPS.AVAILABILITY)
            return
        }

        // Step 4: Availability
        if (active === STEPS.AVAILABILITY) {
            if (check.noAvailability && selectedDays.length === 0) {
                sendNotification({
                    backgroundColor: 'warning',
                    title: 'Alerta',
                    description:
                        'Selecciona al menos un día para configurar la disponibilidad.'
                })

                return
            }

            const input = createFormInput()

            await handleRegisterAvailableProduct(input)
        }
    }

    /**
     * Continues the product creation workflow.
     *
     * @returns {Promise<void>} Current step result.
     */
    const handleContinue = async (): Promise<void> => {
        await handlerSteps()
    }

    const valuesObj = filterKeyObject(
        {
            ...values,
            names
        },
        [
            'ProWeight',
            'carProId',
            'ProHeight'
        ],
        false
    )

    const { error } = productSchema.validate(valuesObj)

    const disabled = {
        0: error,
        1: !isCompleteRequired,
        2: false,
        3: check?.noAvailability && selectedDays.length === 0
    }

    const asSaveAvailableProduct =
        active === STEPS.AVAILABILITY &&
        selectedDays.length > 0

    useEffect(() => {
        if (active === STEPS.COMPLEMENTS) {
            handleGetOneProduct({
                pId: pId ?? food
            })
        }
    }, [active])

    // Workflow step components
    const components = {
        0: (
            <div className={styles.product_details}>
                <div className={styles.product_form}>
                    <FormProduct {...propsForm} />
                </div>

                <div className={styles.product_image}>
                    <ImageProductEdit {...propsImageEdit} />
                </div>

                <div className={styles.product_tags}>
                    <Row>
                        <Text
                            size='3xl'
                            styles={{
                                '-webkitLineClamp': 2,
                                color: getGlobalStyle('--color-text-black'),
                                lineHeight: '1.5rem',
                                marginBottom: '9px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            Tags
                        </Text>

                        <Icon
                            icon='IconTag'
                            size={30}
                            color={getGlobalStyle('--color-icons-black')}
                        />
                    </Row>

                    <InputTags
                        disabled={false}
                        update={true}
                        repeatTag={false}
                        setTags={setNewTags}
                        loading={loadingTags}
                        tags={newTags}
                        registerTags={() => registerTags(newTags ?? [])}
                        sendNotification={sendNotification}
                    />

                    <Divider
                        marginTop={getGlobalStyle('--spacing-sm')}
                    />

                    <Row className={styles.tags_list}>
                        {Array.isArray(dataTags) &&
                            dataTags.map((tag) => (
                                <Row
                                    key={tag.id}
                                    className={styles.contain_tag_list}
                                >
                                    <Button
                                        onClick={() =>
                                            handleAddTag(tag.id, tag.tag)
                                        }
                                        border='none'
                                        borderRadius='0'
                                        padding='0'
                                    >
                                        <Tag label={tag.tag}>
                                            <Icon
                                                icon='IconTag'
                                                size={20}
                                                color={getGlobalStyle('--color-icons-white')}
                                            />
                                        </Tag>
                                    </Button>

                                    <Button
                                        onClick={() => handleRemoveTag(tag)}
                                        border='none'
                                        styles={{
                                            backgroundColor: getGlobalStyle('--color-primary-pink-light'),
                                            opacity: getGlobalStyle('--opacity-75')
                                        }}
                                        borderRadius='5px'
                                        padding='0'
                                    >
                                        <Icon
                                            color={getGlobalStyle('--color-icons-primary')}
                                            icon='IconCancel'
                                        />
                                    </Button>
                                </Row>
                            ))}
                    </Row>

                    {Boolean(tags?.tag) && (
                        <>
                            <Text size='3xl'>Tag seleccionado</Text>
                            <Tag label={tags.tag} />
                        </>
                    )}
                </div>

                <div className={styles.product_preview}>
                    <MemoCardProductSimple
                        del={false}
                        edit={false}
                        onTargetClick={() => inputRef?.current?.click()}
                        onFileInputChange={onFileChange}
                        fileInputRef={inputRef}
                        accept={validTypes}
                        sum={checkStock}
                        handleDecrement={handleDecreaseStock}
                        handleIncrement={handleIncreaseStock}
                        ProQuantity={stock}
                        pId=''
                        tag={tags}
                        ProImage={
                            preview ??
                            '/images/dish-image-placeholder.png'
                        }
                        pName={names}
                        ProPrice={values.ProPrice}
                        ProDescuento={values.ProDescuento}
                        ProDescription={values.ProDescription}
                    />
                </div>
            </div>
        ),

        1: (
            <OptionalExtraProducts
                data={dataLines}
                dataListIds={dataListIds}
                handleAdd={handleAdd}
                handleAddList={handleAddList}
                handleChangeItems={handleChangeItems}
                handleCheck={handleCheckDessert}
                handleRemoveList={handleRemoveList}
                loadingCreateSubDessert={loadingCreateSubDessert}
                pId={pId}
                removeOneItem={removeOneItem}
                setCheck={setCheck}
                setData={setData}
                setTitle={setTitle}
                title={title}
                sendNotification={sendNotification}
            />
        ),

        2: (
            <div className={styles.complements_container}>
                <Button
                    onClick={handleOpenModalDessert}
                    primary
                >
                    Mostrar subproductos
                </Button>

                <ExtrasProductsItems
                    dataExtra={dataExtra}
                    editing={true}
                    modal={openModalDessert}
                    pId={pId}
                    propsExtra={propsExtra}
                    setModal={() => setOpenModalDessert(false)}
                />
            </div>
        ),

        3: (
            <section className={styles.container_availability}>
                <header className={styles.availability_header}>
                    <Text
                        color='primary'
                        size='3xl'
                        weight='bold'
                    >
                        Disponibilidad
                    </Text>

                    <Text
                        size='sm'
                        color='gray'
                    >
                        Configura cuándo pueden comprar este producto.
                        Puedes mantenerlo disponible todos los días o
                        seleccionar los días y horarios de atención.
                    </Text>
                </header>

                <div className={styles.availability_options}>
                    <div className={styles.availability_option}>
                        <Checkbox
                            checked={Boolean(check.availability)}
                            id='checkboxAvailability'
                            label='Siempre disponible'
                            name='availability'
                            onChange={(event) => {
                                handleAvailabilityChange(
                                    'availability',
                                    event.target.checked
                                )
                            }}
                        />

                        <Text
                            size='sm'
                            color='gray'
                        >
                            Los clientes podrán comprar este producto sin
                            restricciones de días u horarios configurados
                            en esta sección.
                        </Text>
                    </div>

                    <div className={styles.availability_option}>
                        <Checkbox
                            checked={Boolean(check.noAvailability)}
                            id='checkboxNoAvailability'
                            label='Horarios específicos'
                            name='noAvailability'
                            onChange={(event) => {
                                handleAvailabilityChange(
                                    'noAvailability',
                                    event.target.checked
                                )
                            }}
                        />

                        <Text
                            size='sm'
                            color='gray'
                        >
                            Define los días de la semana y las horas en
                            que estará disponible para tus clientes.
                        </Text>
                    </div>
                </div>

                {check.noAvailability && (
                    <section className={styles.availability_schedule}>
                        <header className={styles.availability_schedule_header}>
                            <Text
                                size='xl'
                                weight='bold'
                            >
                                Días y horarios
                            </Text>

                            <Text
                                size='sm'
                                color='gray'
                            >
                                Selecciona los días disponibles y configura
                                la hora de inicio y finalización para cada
                                día seleccionado.
                            </Text>
                        </header>

                        <div className={styles.availability_days_content}>
                            <Column>
                                <DaySelector
                                    days={days}
                                    handleChange={handleChangeAvailability}
                                    dayConfigs={dayConfigs}
                                    timeSuggestions={timeSuggestions}
                                    handleDaySelection={handleDaySelection}
                                    selectedDays={selectedDays}
                                />
                            </Column>
                        </div>

                        {selectedDays.length === 0 && (
                            <Text
                                size='sm'
                                color='gray'
                            >
                                Aún no has seleccionado ningún día.
                            </Text>
                        )}
                    </section>
                )}
            </section>
        )
    }

    return (
        <>
            {loaAvailable && <Loading />}

            <div className={styles.food_component}>
                <AwesomeModal
                    customHeight='70vh'
                    footer={false}
                    header={false}
                    onCancel={() => false}
                    onConfirm={() => setShowCategoryModal(false)}
                    onHide={() => setShowCategoryModal(false)}
                    padding='20px'
                    question={false}
                    show={showCategoryModal}
                    size='50%'
                    zIndex={getGlobalStyle('--z-index-modal')}
                >
                    <Categories />
                </AwesomeModal>

                <AwesomeModal
                    btnCancel
                    btnConfirm
                    customHeight='200px'
                    footer={true}
                    header={false}
                    onCancel={() => {}}
                    onConfirm={cancelAll}
                    onHide={handleOpenCloseAlert}
                    padding='20px'
                    question={false}
                    show={openAlertClose}
                    size={MODAL_SIZES.small}
                    zIndex={getGlobalStyle('--z-index-high')}
                >
                    <Text
                        size='3xl'
                        weight='extrabold'
                    >
                        Es posible que el producto no contenga todos los
                        elementos necesarios.
                    </Text>

                    <Divider
                        marginTop={getGlobalStyle('--spacing-2xl')}
                    />
                </AwesomeModal>

                <HeaderSteps
                    active={active}
                    steps={titleHeaders}
                />

                <main className={styles.container_steps}>
                    {components[active]}
                </main>

                <footer className={styles.container_steps_actions}>
                    {active !== STEPS.DESSERTS &&
                        active !== STEPS.PRODUCT && (
                            <Button
                                onClick={() => {
                                    setActive((previous) =>
                                        Math.max(STEPS.PRODUCT, previous - 1)
                                    )
                                }}
                            >
                                Volver
                            </Button>
                        )}

                    {pathname !== '/products' ? (
                        <Button
                            onClick={
                                active === STEPS.DESSERTS
                                    ? handleOpenCloseAlert
                                    : cancelAll
                            }
                        >
                            {active === STEPS.DESSERTS
                                ? 'Cerrar'
                                : 'Cancelar'}
                        </Button>
                    ) : (
                        <div className={styles.actions_spacer} />
                    )}

                    <Button
                        disabled={Boolean(disabled[active])}
                        loading={loading}
                        onClick={handleContinue}
                        primary
                    >
                        {asSaveAvailableProduct
                            ? 'Guardar'
                            : 'Continuar'}
                    </Button>
                </footer>
            </div>
        </>
    )
}

export const FoodComponent = memo(FoodComponentMemo)