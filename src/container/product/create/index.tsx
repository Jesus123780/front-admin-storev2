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
import { Container } from './styled'
import styles from './styles.module.css'
import { FoodComponentMemoProps } from './types'

const titleHeaders = ['DETALLES', 'ADICIONALES', 'COMPLEMENTOS', 'DISPONIBILIDAD']

export const FoodComponentMemo: React.FC<FoodComponentMemoProps> = ({
    active,
    alt,
    check,
    checkStock,
    data,
    dataCategoriesProducts,
    dataFree,
    errors,
    fileInputRef,
    image,
    loading,
    names,
    pId,
    propsImageEdit,
    search,
    showMore,
    src,
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
    handleDecreaseStock = () => { },
    handleDelete,
    handleIncreaseStock = () => { },
    handleRegister,
    onClickClear,
    onTargetClick,
    setActive,
    setCheck: setCheckAvailableDays,
    setErrors,
    setName,
    setShowComponentModal,
    setShowMore,
    ...props
}) => {
    // HOOKS
    const router = useRouter()
    const location = useRouter()
    const searchParams = useSearchParams()
    const [onClickLogout] = useLogout({})
    const pathname = usePathname()
    const { getQuery } = useManageQueryParams({ router: location, searchParams: searchParams })
    const [showCategoryModal, setShowCategoryModal] = useState(false)
    const { setAlertBox, sendNotification } = useContext(Context)

    const [dataStore] = useStore()

    const food = getQuery('food')

    const {
        dataTags,
        handleAddTag,
        handleRemoveTag,
        setNewTags,
        newTags,
        loadingTags,
        registerTags,
        tags,
    } = tagsProps ?? {
        dataTags: [],
        handleAddTag: () => { return false },
        tags: {
            tag: ''
        }
    }
    const { handleQuery, handleCleanQuery } = useManageQueryParams({
        router,
        searchParams
    })

    const {
        handleDaySelection,
        registerAvailableProduct,
        selectedDays,
        setSelectedDays,
        handleCleanSelectedDays,
        loading: loaAvailable,
        days
    } = useSaveAvailableProduct()
    const { idStore } = dataStore ?? {}
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
    // HANDLERS
    const cancelAll = () => {
        setShowComponentModal(false)
        handleClick(false)
        setActive(STEPS.PRODUCT)
        handleCleanQuery('food')
        handleCleanQuery('product')
    }
    const handleShowCategories = () => {
        setShowCategoryModal(!showCategoryModal)
        // if (!pathname) {
        //     setShowComponentModal(4)
        //     handleQuery('categories', 'true')
        // }
    }
    // PROPS
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
    // eslint-disable-next-line
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

    const [openAlertClose, setOpenAlertClose] = useState(false)
    const [openModalDessert, setOpenModalDessert] = useState(true)
    const handleOpenModalDessert = () => {
        setOpenModalDessert(!openModalDessert)
    }
    const [handleGetOneProduct, { dataExtra }] = useGetOneProductsFood({ fetchOnlyProduct: false })

    const handleOpenCloseAlert = () => {
        setOpenAlertClose(!openAlertClose)
    }
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
    } = useDessertWithPrice({ sendNotification, setAlertBox, dataExtra })

    const propsExtra = {
        handleAdd: handleAddExtra,
        handleRemove,
        onSubmitUpdate,
        inputRefs,
        handleSelect,
        handleEdit,
        handleLineChange,
        selected,
        pId: pId,
        loading: l,
        setModal: handleOpenModalDessert,
        modal: openModalDessert,
        handleFocusChange,
        setLine,
        LineItems,
        handleCleanLines: CleanLines
    }

    const handlerCreateDessert = () => {
        if (!pId || !food) {
            setShowComponentModal(false)
            handleClick(false)
            return sendNotification({
                description: 'Lo sentimos, no encontramos tu producto.',
                title: 'Error',
                backgroundColor: 'error'
            })
        }
        if (food) {
            setActive((prev) => { return prev + 1 })
            setOpenModalDessert(true)
        }
        return handleGetOneProduct({ pId: pId ?? food })
    }

    const [dayConfigs, setDayConfigs] = useState<Record<number, { startTime: string; endTime: string }>>({})
    
    const handleChangeAvailability = (day: number, field: 'startTime' | 'endTime', value: string) => {
        setDayConfigs((prev) => ({
            ...prev,
            [day]: { ...prev[day], [field]: value }
        }))
    }
    /**
     * Handles the step-by-step process for product creation.
     */
    const handlerSteps = async () => {
        // Step 1: PRODUCT
        if (active === STEPS.PRODUCT) {
            const res = await handleRegister()
            const result = res?.data?.updateProductFoods
            if (result?.success) {
                sendNotification({
                    backgroundColor: 'success',
                    title: 'Éxito',
                    description: result.message
                })

                const pId = result?.data?.pId
                if (pId) {handleQuery('food', pId)}

                setActive(STEPS.DESSERTS)
                return
            }

            result?.errors?.forEach((err) =>
                sendNotification({
                    backgroundColor: 'error',
                    title: 'Error',
                    description: err.messag
                })
            )

            return
        }

        // Step 2: DESSERTS
        if (active === STEPS.DESSERTS) {
            if (!isCompleteRequired) {
                sendNotification({
                    backgroundColor: 'warning',
                    title: 'Alerta',
                    description: 'Completa los campos requeridos'
                })
                return
            }

            if (food) {
                setActive(STEPS.COMPLEMENTS)
                return
            }
        }

        // Step 3: COMPLEMENTS
        if (active === STEPS.COMPLEMENTS) {
            setActive(STEPS.DISPONIBILITY)
            return
        }

        // Step 4: DISPONIBILITY
        if (active === STEPS.DISPONIBILITY) {
            const input = createFormInput()

            if (check.noAvailability && input.length === 0) {
                sendNotification({
                    backgroundColor: 'warning',
                    title: 'Alerta',
                    description: 'No hay días seleccionados'
                })
                return
            }
            await handleRegisterAvailableProduct(input)
        }
    }


    /**
   * Crea la entrada para la mutación GraphQL.
   * @returns {Array} - Un array de objetos con la información del producto y el día disponible.
   */
    const createFormInput = () => {
        return selectedDays.map((day: number) => {
            return {
                idStore: idStore,
                pId: pId || food,
                dayAvailable: day,
                startDate: dayConfigs[day]?.startTime,
                endDate: dayConfigs[day]?.endTime
            }
        })
    }

    /**
   * Registra el producto y maneja la respuesta.
   * @param {Array} input - La entrada creada por createFormInput.
   */
    const handleRegisterAvailableProduct = async (input) => {
        try {
            const response = await registerAvailableProduct({ variables: { input } })
            const success = response?.data?.registerAvailableProduct?.success
            const message = response?.data?.registerAvailableProduct?.message
            if (success) {
                sendSuccessNotification()
                sendNotification({
                    description: message,
                    title: 'Success',
                    backgroundColor: 'success'
                })
            } else {
                const { message } = response?.data.registerAvailableProduct ?? {
                    message: 'Ha ocurrido un error al guardar los días disponibles'
                }
                sendNotification({
                    description: message,
                    title: 'Error',
                    backgroundColor: 'error'
                })
                if (message === 'Session expired') {
                    await onClickLogout({ redirect: true })
                    setAlertBox({
                        message: 'La sesión ha expirado, por favor vuelve a iniciar sesión'
                    })
                }
            }
        } catch (error) {
            sendNotification({
                description: 'Ha ocurrido un error',
                title: 'Error',
                backgroundColor: 'error'
            })

        }
    }

    /**
   * Envía una notificación de éxito.
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
        handleCleanData({})
        return setErrors({
            ProDescription: false,
            ProDescuento: false,
            ProPrice: false,
            ValueDelivery: false,
            carProId: false,
            names: ''
        })
    }

    /**
   * Envia una notificación de error.
   */
    /**
   * Función principal para continuar con el registro o con los siguientes pasos.
   */
    const handleContinue = async () => {
        await handlerSteps()
    }

    const valuesObj = filterKeyObject({ ...values, names }, ['ProWeight', 'carProId', 'ProHeight'], false)
    const { error } = productSchema.validate(valuesObj)

    const disabled = {
        0: error,
        1: !isCompleteRequired,
        2: false,
        3: check?.noAvailability ? Boolean(!selectedDays.length > 0) : false
    }
    const asSaveAvailableProduct = disabled && selectedDays?.length > 0

    useEffect(() => {
        if (active === STEPS.COMPLEMENTS) {
            handleGetOneProduct({ pId: pId ?? food })
        }

    }, [active])

    const {
        preview,
        inputRef,
        onFileChange,
        validTypes,
    } = propsImageEdit ?? {}
    const components = {
        0: <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: getGlobalStyle('--spacing-lg'),
                padding: getGlobalStyle('--spacing-lg'),
                backgroundColor: getGlobalStyle('--color-base-white'),
                height: '100%'
            }}
        >
            <div>
                <FormProduct {...propsForm} />
            </div>

            <div>
                <ImageProductEdit {...propsImageEdit} />
            </div>
            <div>
                <Text
                    size='3xl'
                    styles={{
                        '-webkitLine-clamp': 2,
                        color: getGlobalStyle('--color-text-black'),
                        lineHeight: '1.5rem',
                        marginBottom: '9px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}
                >
                    Tags
                </Text>
                <InputTags
                    disabled={false}
                    update={true}
                    repeatTag={false}
                    setTags={setNewTags}
                    loading={loadingTags}
                    tags={newTags}
                    registerTags={() => {
                        registerTags(newTags ?? [])
                    }}
                    sendNotification={sendNotification}
                />
                <Divider marginTop={getGlobalStyle('--spacing-sm')} />
                <Row style={{
                    flexWrap: 'wrap'
                }}>
                    {!!Array.isArray(dataTags) &&
                        dataTags?.map((tag) => (
                            <Row key={tag.id}
                                className={styles.contain_tag_list}
                                style={{
                                    width: 'min-content',
                                    display: 'flex'
                                }}
                            >
                                <Button
                                    onClick={() => handleAddTag(tag.id, tag.tag)}
                                    border='none'
                                    borderRadius='0'
                                    padding='0'

                                >
                                    <Tag label={tag.tag} />
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
                {Boolean(tags?.tag !== '') && <>
                    <Text size='3xl'>
                        Tag seleccionado
                    </Text>
                    <Tag label={tags.tag} />
                </>
                }
            </div>
            <div>
                <MemoCardProductSimple
                    del={false}
                    edit={false}
                    onTargetClick={() => inputRef?.current?.click()}
                    onFileInputChange={onFileChange}
                    fileInputRef={inputRef}
                    accept={validTypes}
                    sum={checkStock}
                    handleDecrement={() => {
                        return handleDecreaseStock()
                    }}
                    handleIncrement={() => {
                        return handleIncreaseStock()
                    }}
                    ProQuantity={stock}
                    pId=''
                    tag={tags}
                    ProImage={preview ?? '/images/dish-image-placeholder.png'}
                    pName={names}
                    ProPrice={values.ProPrice}
                    ProDescuento={values.ProDescuento}
                    ProDescription={values.ProDescription}
                />
            </div>
        </div>
        ,
        1: <OptionalExtraProducts
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
        />,
        2: <div style={{ flexDirection: 'column', display: 'flex' }}>
            <Button
                onClick={() => { return setOpenModalDessert(!openModalDessert) }}
                primary={true}
            >
                Mostrar subproductos
            </Button>
            <ExtrasProductsItems
                dataExtra={dataExtra}
                editing={true}
                modal={openModalDessert}
                pId={pId}
                propsExtra={propsExtra}
                setModal={() => { return setOpenModalDessert(false) }}
            />
        </div>,
        3: <div className='container_availability'>
            <Text color='primary'>
                Disponibilidad
            </Text>
            <br />
            <br />
            <Text size='sm'>
                Aquí Puedes definir en que momentos los clientes pueden comprar este producto.
            </Text>
            <Checkbox
                checked={check.availability}
                id='checkboxAvailability'
                label='Siempre disponible'
                name='availability'
                onChange={(e) => {
                    handleCheck(e)
                    if (check.noAvailability) {
                        document.getElementById('checkbox-checkboxNoAvailability').click()
                    }
                }}
            />
            <Checkbox
                checked={check.noAvailability}
                id='checkboxNoAvailability'
                label='Disponible en horarios específicos'
                name='noAvailability'
                onChange={(e) => {
                    handleCheck(e)
                    if (check.availability) {
                        document.getElementById('checkbox-checkboxAvailability').click()
                    }
                }}
            />
            {check.noAvailability &&
                <>
                    <Text size='sm' weight='hairline'>
                        Dias de la semana
                    </Text>
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
                </>
            }
        </div>
    }


    return (<>
        {loaAvailable && <Loading />}
        <Container>
            <AwesomeModal
                customHeight='70vh'
                footer={false}
                header={false}
                onCancel={() => { return false }}
                onConfirm={() => { return setShowCategoryModal(false) }}
                onHide={() => { return setShowCategoryModal(false) }}
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
                onCancel={() => { return }}
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
                    Es posible que el producto no contenga todos los elementos necesarios.
                </Text>
                <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
            </AwesomeModal>
            <HeaderSteps active={active} steps={titleHeaders} />
            <div className={styles.container_steps}>
                {components[active]}
            </div>
            <div className={styles.container_steps_actions}>
                {(active !== 1 && active !== 0) &&
                    <Button onClick={() => { return setActive((prev) => { return active === 1 ? 1 : prev - 1 }) }}>
                        Volver
                    </Button>
                }
                {pathname === '/products' ? <div></div> :
                    <Button onClick={active === 1 ? handleOpenCloseAlert : cancelAll}>
                        {active === 1 ? 'Cerrar' : 'Cancelar'}
                    </Button>
                }
                <Button
                    disabled={disabled[active]}
                    loading={loading}
                    onClick={() => {
                        return handleContinue()
                    }}
                    primary
                >
                    {asSaveAvailableProduct ? 'Guardar' : 'Continuar'}
                </Button>
            </div>
        </Container>
    </>
    )
}

export const FoodComponent = memo(FoodComponentMemo)