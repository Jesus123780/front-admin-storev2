'use client'

import React from 'react'
import { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { Context } from '../../context/Context'
import {
  useProductsFood,
  useDeleteProductsFood,
  useCreateProduct,
  useCategoriesProduct
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
    handleIncreaseStock,
    handleCheckStock,
    stock,
    values,
    ...propsCreateProduct
  } = useCreateProduct({
    setAlertBox,
    handleCloseCreateProduct,
    sendNotification,
    router
  })
  console.log('searchFilter', values)
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
    handleAddTag,
    dataTags: dataTags,
    tags
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
    valuesForm: values
  }

  return (
    <FoodComponent {...foodComponentProps} />
  )
}
