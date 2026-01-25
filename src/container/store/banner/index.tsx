'use client'

import {
  useImageStore,
  useSchedules,
  useStatusOpenStore,
  useStore
} from 'npm-pkg-hook'
import { BannerStore, IStoreInterface } from 'pkg-components'
import React, { memo, useContext } from 'react'

import { Context } from '../../../context/Context'
interface IStore {
  Image: string
  scheduleOpenAll: string
  idStore: string
  storeName: string
  banner: string
}

type BannerProps = {
  isMobile: boolean
  isTablet: boolean
  store: IStore
}
export const Banner = ({
  isMobile,
  isTablet,
  store,
}: BannerProps) => {
  // HOOKS
  const { sendNotification } = useContext(Context)
  const {
    altLogo,
    srcLogo,
    fileInputRef,
    fileInputRefLogo,
    setPreviewImg,
    setPreviewImgLogo,
    HandleDeleteBanner,
    handleInputChangeLogo,
    handleUpdateBanner,
    handleDeleteLogo,
    onTargetClick,
    onTargetClickLogo,
    src
  } = useImageStore({ idStore: store?.idStore, sendNotification })
  useStore({
    callback: (data: IStore) => {
      setPreviewImgLogo({
        altLogo: altLogo ?? '',
        srcLogo: data?.Image ? `/api/images/${data.Image}` : srcLogo
      })
      setPreviewImg({
        src: data?.banner ? `/api/images/${data.banner}` : src
      })
    }
  });

  const [dataSchedules, { loading: lsc }] = useSchedules({ schDay: 1 })
  const { open, openNow } = useStatusOpenStore({ dataSchedules })
  const isLoading = lsc
  const isEmtySchedules = dataSchedules?.length === 0
  const handleClose = () => {
    return sendNotification({ 
      title: 'Banner', 
      description: 'Muy pronto',
      position: 'top-right',
    })
  }
  const props = {
    altLogo,
    fileInputRef,
    fileInputRefLogo,
    HandleDeleteBanner,
    handleInputChangeLogo,
    handleClose,
    handleUpdateBanner,
    isEdit: true,
    isEmtySchedules,
    isLoading,
    isMobile,
    onTargetClick,
    onTargetClickLogo,
    open: store?.scheduleOpenAll ? 'Abierto todos los días' : open,
    openNow: store?.scheduleOpenAll ? true : openNow,
    isTablet,
    src,
    srcLogo,
    handleDeleteLogo,
    store: ({ ...store, Image: src } as IStoreInterface)
  }
  return (<BannerStore {...props} />)
}

export const ManageBanner = memo(Banner)
