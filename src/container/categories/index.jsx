'use client'

import { gql, useMutation } from '@apollo/client'
import {
  REGISTER_CAT_OF_PRODUCTS,
  useCategoryInStore,
  useFormTools
} from 'npm-pkg-hook'
import {
  AwesomeModal,
  Button,
  DragDropContext,
  Draggable,
  Droppable,
  getGlobalStyle,
  Icon,
  InputHooks,
  Loading,
  PColor,
  RippleButton,
  Section,
  Table
} from 'pkg-components'
import PropTypes from 'prop-types'
import React, {
  useContext,
  useEffect,
  useState
} from 'react'

import { Context } from '../../context/Context'
import styles from './styles.module.css'

/**
 * Compara el contenido de las categorías sin tener en cuenta su orden.
 * Esto permite conservar el orden local definido mediante drag-and-drop,
 * evitando actualizar el estado si useCategoryInStore devuelve un array
 * nuevo en cada render con los mismos datos.
 */
const haveSameCategories = (current = [], incoming = []) => {
  if (!Array.isArray(current) || !Array.isArray(incoming)) {
    return false
  }

  if (current.length !== incoming.length) {
    return false
  }

  const currentById = new Map(
    current.map((category) => [
      String(category?.carProId ?? ''),
      {
        pName: category?.pName ?? '',
        ProDescription: category?.ProDescription ?? ''
      }
    ])
  )

  return incoming.every((category) => {
    const id = String(category?.carProId ?? '')
    const currentCategory = currentById.get(id)

    return currentCategory !== undefined &&
      currentCategory.pName === (category?.pName ?? '') &&
      currentCategory.ProDescription === (category?.ProDescription ?? '')
  })
}

export const Categories = ({ isDragDisabled = true }) => {
  const { data: datCat } = useCategoryInStore({})
  const { setAlertBox, sendNotification } = useContext(Context)
  const [handleChange, handleSubmit, handleForcedData, { dataForm, errorForm }] = useFormTools()
  const [showCategories, setShowCategories] = useState(false)

  // QUERIES
  const [createCategoryProduct, { loading }] = useMutation(REGISTER_CAT_OF_PRODUCTS, {
    onError: (e) => {
      setAlertBox({
        type: 'error',
        message: e.message.replace('GraphQL error: Ocurrió un error', '')
      })
    }
  })

  // Esta función se conserva como en el componente original.
  // Debe conectarse a la mutación de borrado real para que el botón elimine categorías.
  const deleteCatFinalOfProducts = () => { }

  const EDIT_CATEGORY_PRODUCT = gql`
    mutation EditOneCategoryProduct($pName: String!, $ProDescription: String, $carProId: ID!) {
      editOneCategoryProduct(pName: $pName, ProDescription: $ProDescription, carProId: $carProId) {
        success
        message
      }
    }
  `

  const [editCategoryProduct, { loading: loadingCategory }] = useMutation(EDIT_CATEGORY_PRODUCT)

  // HANDLES
  const handleForm = (e) => {
    return handleSubmit({
      event: e,
      action: async () => {
        const {
          catName,
          catDescription,
          carProId
        } = dataForm

        if (carProId) {
          const editCate = {
            pName: catName,
            ProDescription: catDescription,
            carProId
          }

          const { data } = await editCategoryProduct({
            variables: {
              ...editCate
            },
            update(cache) {
              cache.modify({
                fields: {
                  catProductsAll(dataOld = []) {
                    return dataOld.map((cate) => {
                      if (cate?.carProId === carProId) {
                        return { ...cate, ...editCate }
                      }
                      return cate
                    })
                  },
                  getCatProductsWithProduct(dataOld = {}) {
                    try {
                      const { catProductsWithProduct } = dataOld || {}

                      if (!Array.isArray(catProductsWithProduct)) {
                        return dataOld
                      }

                      const targetProductIndex = catProductsWithProduct.findIndex(
                        (catProduct) => catProduct?.carProId === carProId
                      )

                      if (targetProductIndex === -1) {
                        return dataOld
                      }

                      const updatedCatProductsWithProduct = catProductsWithProduct.map(
                        (catProduct, index) => {
                          if (index === targetProductIndex) {
                            return {
                              ...catProduct,
                              pName: editCate.pName,
                              ProDescription: editCate.ProDescription
                            }
                          }
                          return catProduct
                        }
                      )

                      return {
                        ...dataOld,
                        catProductsWithProduct: updatedCatProductsWithProduct
                      }
                    } catch {
                      setShowCategories(false)
                      return dataOld
                    }
                  }
                }
              })
            }
          })

          if (!data?.editOneCategoryProduct?.success) {
            return sendNotification({
              description: 'Ocurrió un error',
              title: 'Error',
              backgroundColor: 'error'
            })
          }

          setShowCategories(false)
          return sendNotification({
            description: 'Categoría actualizada exitosamente',
            title: 'Editada',
            backgroundColor: 'success'
          })
        }

        return createCategoryProduct({
          variables: {
            input: {
              pName: catName,
              ProDescription: catDescription
            }
          }
        })
      },
      actionAfterSuccess: () => {
        handleForcedData({})
        setShowCategories(false)
      }
    })
  }

  // Inicializa el estado siempre con un array.
  const [items, setItems] = useState(() => (Array.isArray(datCat) ? datCat : []))

  // FIX: no ejecutar setItems si la consulta entrega un array nuevo con el mismo
  // contenido. Esto evita el ciclo de renderizado que termina en
  // "Maximum update depth exceeded". La comparación ignora el orden para no
  // deshacer un reordenamiento local hecho con drag-and-drop.
  useEffect(() => {
    const nextItems = Array.isArray(datCat) ? datCat : []

    setItems((currentItems) => {
      if (haveSameCategories(currentItems, nextItems)) {
        return currentItems
      }
      return nextItems
    })
  }, [datCat])

  const handleOnDragEnd = (result) => {
    const destination = result?.destination
    const source = result?.source

    if (!destination || !source || destination.index === source.index) {
      return
    }

    setItems((currentItems) => {
      if (!Array.isArray(currentItems)) {
        return []
      }

      if (
        source.index < 0 ||
        source.index >= currentItems.length ||
        destination.index < 0 ||
        destination.index >= currentItems.length
      ) {
        return currentItems
      }

      const reorderedItems = Array.from(currentItems)
      const [movedItem] = reorderedItems.splice(source.index, 1)

      if (movedItem === undefined) {
        return currentItems
      }

      reorderedItems.splice(destination.index, 0, movedItem)
      return reorderedItems
    })
  }

  return (
    <>
      {loading && <Loading />}

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable
          droppableId='droppable-table'
          direction='vertical'
          isDropDisabled={false}
          isCombineEnabled={false}
          ignoreContainerClipping={false}
        >
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              <Table
                data={items}
                labelBtn='Product'
                renderBody={(dataB, titles) => {
                  return dataB?.map((x, i) => {
                    const categoryId = String(x?.carProId ?? '')

                    return (
                      <Draggable
                        draggableId={categoryId}
                        index={i}
                        isDragDisabled={Boolean(isDragDisabled) || categoryId === ''}
                        key={categoryId || `category-${i}`}
                      >
                        {(providedDraggable) => (
                          <Section
                            columnWidth={titles}
                            ref={providedDraggable.innerRef}
                            {...providedDraggable.draggableProps}
                            odd
                            padding='10px 0'
                          >
                            <div
                              {...providedDraggable.dragHandleProps}
                              style={{
                                cursor: isDragDisabled ? 'default' : 'grab',
                                padding: '20px',
                                backgroundColor: getGlobalStyle('--color-base-transparent')
                              }}
                            >
                              <Icon
                                color={getGlobalStyle('--color-icons-gray')}
                                icon='IconDragHandle'
                                size={20}
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                              <span>{x.pName}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <span>{x.ProDescription}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <button
                                type='button'
                                onClick={() => {
                                  return deleteCatFinalOfProducts({
                                    variables: { idPc: x.carProId },
                                    update(cache) {
                                      cache.modify({
                                        fields: {
                                          catProductsAll(dataOld = []) {
                                            return dataOld
                                          }
                                        }
                                      })
                                    }
                                  })
                                }}
                                style={{
                                  backgroundColor: getGlobalStyle('--color-base-transparent'),
                                  cursor: 'pointer'
                                }}
                              >
                                <Icon icon='IconDelete' color={PColor} size={20} />
                              </button>
                            </div>

                            <Button
                              onClick={() => {
                                setShowCategories(true)
                                handleForcedData({
                                  catName: x.pName,
                                  catDescription: x.ProDescription,
                                  carProId: x.carProId
                                })
                              }}
                              styles={{
                                border: 'none',
                                backgroundColor: 'transparent'
                              }}
                            >
                              Editar
                              <Icon
                                color={getGlobalStyle('--color-icons-primary')}
                                icon='IconEdit'
                                size={15}
                              />
                            </Button>
                          </Section>
                        )}
                      </Draggable>
                    )
                  })
                }}
                titles={[
                  { name: '', key: '', justify: 'flex-start', width: '10%' },
                  { name: 'Nombre', key: '', justify: 'flex-start', width: '1fr' },
                  { name: 'Descripción', justify: 'flex-center', width: '1fr' },
                  { name: 'Borrar', justify: 'flex-center', width: '1fr' },
                  { name: 'Acciones', justify: 'flex-center', width: '1fr' }
                ]}
              />
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        className={styles.button_action_categories}
        onClick={() => setShowCategories(true)}
      >
        Adicionar Categorías
      </Button>

      <AwesomeModal
        borderRadius='10px'
        btnCancel={true}
        btnConfirm={false}
        customHeight='min-content'
        title='Categorías de Productos'
        footer={false}
        header={true}
        onCancel={() => false}
        onHide={() => {
          handleForcedData({})
          setShowCategories(false)
        }}
        padding='25px'
        show={showCategories}
        size='small'
        zIndex={getGlobalStyle('--z-index-99999')}
      >
        <form className='form-horizontal' onSubmit={handleForm}>
          <InputHooks
            error={errorForm?.catName}
            name='catName'
            onChange={handleChange}
            required
            title='Nombre de la categoría'
            value={dataForm?.catName}
            width='100%'
          />
          <InputHooks
            error={errorForm?.catDescription}
            name='catDescription'
            onChange={handleChange}
            title='Descripción'
            as='textarea'
            value={dataForm?.catDescription}
            width='100%'
          />
          <RippleButton loading={loadingCategory || loading} type='submit'>
            {dataForm?.carProId ? 'Actualizar' : 'Guardar'}
          </RippleButton>
        </form>
      </AwesomeModal>
    </>
  )
}

Categories.propTypes = {
  isDragDisabled: PropTypes.bool,
  SHOW_MODAL_UPDATE_PRODUCTS: PropTypes.shape({
    setState: PropTypes.func,
    state: PropTypes.any
  })
}
