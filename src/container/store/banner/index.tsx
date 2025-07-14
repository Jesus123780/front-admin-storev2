'use client'

import PropTypes from 'prop-types'
import React, { memo, useContext } from 'react'
import { BannerStore } from 'pkg-components'
import {
  useImageStore,
  useSchedules,
  useStore,
  useStatusOpenStore
} from 'npm-pkg-hook'
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
    fileInputRef,
    fileInputRefLogo,
    setPreviewImg,
    HandleDeleteBanner,
    handleInputChangeLogo,
    handleUpdateBanner,
    handleDeleteLogo,
    onTargetClick,
    onTargetClickLogo,
    src,
    srcLogo
  } = useImageStore({ idStore: store?.idStore, sendNotification })
  useStore({
    callback: (data: IStore) => {
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
    return sendNotification({ title: 'Banner', description: 'Muy pronto' })
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
    store
  }
  return (<BannerStore {...props} />)
}

Banner.propTypes = {
  isMobile: PropTypes.any,
  store: PropTypes.shape({
    Image: PropTypes.string,
    scheduleOpenAll: PropTypes.string,
    idStore: PropTypes.any,
    storeName: PropTypes.any
  })
}
export const ManageBanner = memo(Banner)
