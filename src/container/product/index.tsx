'use client'

import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { Context } from '../../context/Context'
import {
  useProductsFood,
  useDeleteProductsFood,
  useCreateProduct,
  useRegisterMultipleTags,
  useCategoriesProduct,
  useImageUploaderProduct,
} from 'npm-pkg-hook'
import { FoodComponent } from './create'

export const Product = () => {
  const {
    setAlertBox,
    sendNotification,
    handleClick,
    setShowComponentModal
  } = useContext(Context)
  const router = useRouter()
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
    ...propsCreateProduct
  } = useCreateProduct({
    handleCloseCreateProduct,
    image,
    router,
    sendNotification,
    setAlertBox
  })

  const [registerTags, { loading: loadingTags }] = useRegisterMultipleTags({
    callback: (data: any) => {
      const { success } = data ?? {
        success: false
      }
      if (success) {
        setNewTags([])
      }
      
    }
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
    registerTags,
    handleAddTag,
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
