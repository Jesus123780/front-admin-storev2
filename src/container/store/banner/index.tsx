'use client'

import PropTypes from 'prop-types'
import React, { memo, useContext } from 'react'
import { BannerStore } from 'pkg-components'
import {
  useBanner,
  useImageStore,
  useSchedules,
  useStatusOpenStore
} from 'npm-pkg-hook'
import { Context } from '../../../context/Context'

type BannerProps = {
  isMobile: boolean
  store: {
    Image: string
    scheduleOpenAll: string
    idStore: string
    storeName: string
  }
}
export const Banner = ({ isMobile, store }: BannerProps) => {
  // HOOKS
  const { sendNotification } = useContext(Context)
  const {
    altLogo,
    fileInputRef,
    fileInputRefLogo,
    HandleDeleteBanner,
    handleInputChangeLogo,
    handleUpdateBanner,
    onTargetClick,
    onTargetClickLogo,
    src,
    srcLogo
  } = useImageStore({ idStore: store?.idStore, sendNotification })
  const [banner] = useBanner()
  const [dataSchedules, { loading: lsc }] = useSchedules({ schDay: 1 })
  const { path, bnImageFileName } = banner || {}
  const { open, openNow } = useStatusOpenStore({ dataSchedules })
  const isLoading = lsc
  const isEmtySchedules = dataSchedules?.length === 0
  const handleClose = () => {
    return sendNotification({ title: 'Banner', description: 'Muy pronto' })
  }
  const props = {
    altLogo,
    banner,
    bnImageFileName,
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
    path,
    src,
    srcLogo,
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
