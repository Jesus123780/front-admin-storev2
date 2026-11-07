'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  useCategoriesProduct,
  useCreateProduct,
  useDeleteProductsFood,
  useImageUploaderProduct,
  useProductsFood,
} from 'npm-pkg-hook'
import React, { useContext } from 'react'

import { Context } from '../../context/Context'
import { FoodComponent } from './create'

interface ProductProps {
  /**
   * Código de barras para precargar el formulario. Tiene prioridad sobre el
   * query param `?barcode=`. Lo usa el drawer de creación embebido en ventas.
   */
  barcode?: string
  /**
   * Callback invocado tras crear un producto (con sus datos). En ventas lo usa
   * para agregarlo automáticamente al carrito (AC-10).
   */
  onProductCreated?: (product: Record<string, unknown>) => void
}

export const Product = ({ barcode, onProductCreated }: ProductProps = {}) => {
  const {
    setAlertBox,
    sendNotification,
    handleClick,
    setShowComponentModal
  } = useContext(Context)
  const router = useRouter()
  const searchParams = useSearchParams()
  // Código de barras precargado: prioridad al prop (drawer embebido en ventas),
  // si no, al query param `?barcode=` (persiste al recargar, AC-22).
  const initialBarcode = barcode ?? searchParams?.get('barcode') ?? ''
  const propsUploadProductImage = useImageUploaderProduct({
    sendNotification
  })
  const { image } = propsUploadProductImage
  // STATES AND HOOKS
  const handleCloseCreateProduct = () => {
    handleClick(false)
    setShowComponentModal(false)
  }
  const {
    dataTags,
    loading: loadingCreatingProduct,
    handleAddTag,
    handleRemoveTag,
    handleRegisterTags,
    search,
    searchFilter,
    showMore,
    tags,
    handleDecreaseStock,
    checkStock,
    setNewTags, 
    newTags,
    handleIncreaseStock,
    handleCheckStock,
    stock,
    values,
    // Robust create & persist flow (normalizes input, dedupes, never
    // calls the mutation with an empty array).
    handleRegisterDraftTags,
    loadingRegisterTags: loadingTags,
    ...propsCreateProduct
  } = useCreateProduct({
    handleCloseCreateProduct,
    image,
    router,
    sendNotification,
    setAlertBox,
    initialBarcode,
    onProductCreated
  })

  const [productsFood, { loading, fetchMore }] = useProductsFood({
    search: search?.length >= 4 ? search : '',
    gender: searchFilter?.gender || [],
    desc: searchFilter?.desc || [],
    categories: searchFilter?.speciality,
    max: showMore,
    min: 0
  })

  const [dataCategoriesProducts] = useCategoriesProduct()
  const { handleDelete } = useDeleteProductsFood()

  const tagsProps = {
    handleRegisterTags,
    registerTags: handleRegisterDraftTags,
    handleAddTag,
    handleRemoveTag,
    loadingTags,
    dataTags: dataTags,
    setNewTags, 
    newTags,
    tags
  }

  const propsImageEdit = {
    ...propsUploadProductImage
  }
  const foodComponentProps = {
    ...propsCreateProduct,
    data: productsFood,
    dataCategoriesProducts: dataCategoriesProducts,
    dataFree: [],
    fetchMore,
    handleDelete,
    loading: loading || loadingCreatingProduct,
    tagsProps: tagsProps,
    values,
    handleDecreaseStock,
    checkStock,
    handleIncreaseStock,
    stock,
    handleClick,
    sendNotification,
    handleCheckStock,
    setShowComponentModal,
    setAlertBox,
    valuesForm: values,
    propsImageEdit: propsImageEdit
  }

  return (
    <FoodComponent {...foodComponentProps} />
  )
}
