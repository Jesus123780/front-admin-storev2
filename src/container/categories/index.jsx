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
  const deleteCatFinalOfProducts = () => {

  }
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
            }, update(cache) {
              cache.modify({
                fields: {
                  catProductsAll(dataOld = []) {
                    const newDataCat = dataOld.map((cate) => {
                      if (cate.carProId === carProId) {
                        return { ...editCate }
                      }
                      return cate

                    })
                    return newDataCat
                  },
                  getCatProductsWithProduct(dataOld = {}) {
                    try {
                      const { catProductsWithProduct } = dataOld || {}
                      // Find the index of the specific product based on carProId
                      if (!Array.isArray(catProductsWithProduct)) { return dataOld }
                      const targetProductIndex = catProductsWithProduct.findIndex((catProduct) => { return catProduct?.carProId === carProId })
                      if (targetProductIndex === -1) { return dataOld }
                      // Create a new array with the updated pName
                      const updatedCatProductsWithProduct = catProductsWithProduct.map((catProduct, index) => {
                        // If it's the target product and editCate has the new pName, update pName
                        if (index === targetProductIndex && editCate?.pName) {
                          return {
                            ...catProduct,
                            pName: editCate.pName
                          }
                        }
                        return catProduct // Otherwise, return the product unchanged
                      })
                      return {
                        catProductsWithProduct: updatedCatProductsWithProduct,
                        totalCount: dataOld.totalCount
                      }
                    } catch (error) {
                      setShowCategories(false)
                      return dataOld
                    }
                  }
                }
              })
            }
          })
          if (!data.editOneCategoryProduct.success) {
            return sendNotification({
              description: 'Ocurrió un error',
              title: 'Error',
              backgroundColor: 'error'
            })
          }
          if (data.editOneCategoryProduct.success) {
            setShowCategories(false)
            return sendNotification({
              description: 'Categoría actualizada exitosamente',
              title: 'Editada',
              backgroundColor: 'success'
            })
          }
        } else {
          return createCategoryProduct({
            variables: {
              input: {
                pName: catName,
                ProDescription: catDescription
              }
            },
            update(cache) {
              cache.modify({
                fields: {
                  // catProductsAll(dataOld = []) {
                  //   return cache.writeQuery({
                  //     query: GET_ULTIMATE_CATEGORY_PRODUCTS,
                  //     data: dataOld
                  //   })
                  // }
                }
              })
              cache.modify({
                fields: {
                  // getCatProductsWithProduct(dataOld = []) {
                  //   return cache.writeQuery({
                  //     query: GET_ALL_CATEGORIES_WITH_PRODUCT,
                  //     data: dataOld
                  //   })
                  // }
                }
              })
            }
          })
        }
      },
      actionAfterSuccess: () => {
        handleForcedData({})
        setShowCategories(!showCategories)
      }
    })
  }

  const [items, setItems] = useState(datCat)
  useEffect(() => {
    setItems(datCat)
  }, [datCat])

  const handleOnDragEnd = (result) => {
    if (!result.destination) { return } // No se ha soltado en una posición válida

    const startIndex = result.source.index
    const endIndex = result.destination.index

    const reorderedItems = Array.from(items)
    const [movedItem] = reorderedItems.splice(startIndex, 1) // Remueve el elemento movido de la posición inicial
    reorderedItems.splice(endIndex, 0, movedItem) // Inserta el elemento movido en la posición final
    setItems(reorderedItems)
  }

  return (
    <>
      {loading && <Loading />}
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId='droppable-table' isCombineEnabled={false} ignoreContainerClipping={false}>
          {(provided) => {
            return (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <Table
                  data={items}
                  labelBtn='Product'
                  renderBody={(dataB, titles) => {
                    return dataB?.map((x, i) => {
                      return (
                        <Draggable
                          draggableId={x.carProId.toString()}
                          index={i}
                          isDragDisabled={Boolean(isDragDisabled)}
                          key={x.carProId}
                        >
                          {(provided) => {
                            return (
                              <Section
                                columnWidth={titles}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                odd
                                padding='10px 0'
                              >
                                <div {...provided.dragHandleProps} style={{ cursor: 'grab', padding: '20px', backgroundColor: getGlobalStyle('--color-base-transparent') }}>
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
                                  <span> {x.ProDescription}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                  <button
                                    onClick={() => {
                                      return deleteCatFinalOfProducts({
                                        variables: { idPc: x.carProId }, update(cache) {
                                          cache.modify({
                                            fields: {
                                              catProductsAll(dataOld = []) {
                                                // return cache.writeQuery({
                                                //   query: GET_ULTIMATE_CATEGORY_PRODUCTS,
                                                //   data: dataOld
                                                // })
                                              }
                                            }
                                          })
                                        }
                                      })
                                    }}
                                    style={{ backgroundColor: getGlobalStyle('--color-base-transparent'), cursor: 'pointer' }}
                                  >
                                    <Icon icon='IconDelete' color={PColor} size={20} />
                                  </button>
                                </div>
                                <Button
                                  onClick={() => {
                                    setShowCategories(!showCategories)
                                    return handleForcedData({
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
                            )
                          }}
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
            )
          }}
        </Droppable>
      </DragDropContext>
      <Button className={styles.button_action_categories} onClick={() => { return setShowCategories(!showCategories) }}>
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
        onCancel={() => { return false }}
        onHide={() => {
          handleForcedData({})
          setShowCategories(!showCategories)
        }}
        padding='25px'
        show={showCategories}
        size='small'
        zIndex={getGlobalStyle('--z-index-99999')}
      >
        <form className='form-horizontal' onSubmit={(e) => { return handleForm(e) }}>
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
            title='Description'
            as='textarea'
            value={dataForm?.catDescription}
            width='100%'
          />
          <RippleButton loading={loadingCategory} type='submit'>
            {dataForm?.carProId ? 'Actualizar' : 'Guardar'}
          </RippleButton>
        </form>
      </AwesomeModal>
    </>
  )
}

Categories.propTypes = {
  SHOW_MODAL_UPDATE_PRODUCTS: PropTypes.shape({
    setState: PropTypes.func,
    state: PropTypes.any
  })
}
