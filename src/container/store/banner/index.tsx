'use client'

import {
  useImageStore,
  useSchedules,
  useStatusOpenStore,
  useStore
} from 'npm-pkg-hook'
import type { IStoreInterface } from 'pkg-components'
import { BannerStore } from 'pkg-components'
import React, {
  memo,
  useContext,
  useEffect
} from 'react'

import { Context } from '../../../context/Context'

interface BannerProps {
  isMobile: boolean
  isTablet: boolean
  store: IStoreInterface
}

/**
 * Convierte el nombre del archivo en la URL del endpoint
 * encargado de servir las imágenes almacenadas.
 */
const getImageUrl = (filename?: string | null): string | undefined => {
  const normalizedFilename = String(filename ?? '').trim()

  if (
    !normalizedFilename ||
    normalizedFilename === 'null' ||
    normalizedFilename === 'undefined'
  ) {
    return undefined
  }

  return `/api/images/${encodeURIComponent(normalizedFilename)}`
}

export const Banner = ({
  isMobile,
  isTablet,
  store
}: BannerProps) => {
  const { sendNotification } = useContext(Context)

  // --------------------------------------------------
  // IMAGE STORE
  // --------------------------------------------------

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
  } = useImageStore({
    idStore: store?.idStore ?? undefined,
    sendNotification
  })

  // --------------------------------------------------
  // INITIALIZE BANNER FROM STORE
  // --------------------------------------------------

  /**
   * Al cargar o cambiar la tienda, utilizamos el nombre
   * del archivo almacenado en store.banner.
   *
   * El endpoint /api/images/[filename] se encarga de
   * devolver la imagen o el placeholder correspondiente.
   */
  useEffect(() => {
    const bannerUrl = getImageUrl(store?.banner)

    if (!bannerUrl) {return}

    setPreviewImg({
      alt: '',
      src: bannerUrl
    })
  }, [store?.banner, setPreviewImg])

  // --------------------------------------------------
  // INITIALIZE LOGO FROM STORE
  // --------------------------------------------------

  useEffect(() => {
    const logoUrl = getImageUrl(store?.Image)

    if (!logoUrl) {return}

    setPreviewImgLogo({
      altLogo: altLogo ?? '',
      srcLogo: logoUrl
    })
  }, [store?.Image, altLogo, setPreviewImgLogo])

  // --------------------------------------------------
  // STORE SUBSCRIPTION
  // --------------------------------------------------

  /**
   * Mantiene sincronizadas las imágenes cuando el store
   * se actualiza desde useStore.
   */
  useStore({
    callback: (data: Partial<IStoreInterface>) => {
      const bannerFilename = data?.banner ?? store?.banner
      const logoFilename = data?.Image ?? store?.Image

      const bannerUrl = getImageUrl(bannerFilename)
      const logoUrl = getImageUrl(logoFilename)

      if (bannerUrl) {
        setPreviewImg({
          alt: '',
          src: bannerUrl
        })
      }

      if (logoUrl) {
        setPreviewImgLogo({
          altLogo: altLogo ?? '',
          srcLogo: logoUrl
        })
      }
    }
  })

  // --------------------------------------------------
  // SCHEDULES
  // --------------------------------------------------

  const [dataSchedules, { loading: lsc }] = useSchedules({
    schDay: 1
  })

  const { open, openNow } = useStatusOpenStore({
    dataSchedules
  })

  const isLoading = lsc
  const isEmtySchedules = dataSchedules?.length === 0

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------

  const handleClose = () => {
    sendNotification({
      title: 'Banner',
      description: 'Muy pronto',
      position: 'top-right'
    })
  }

  // --------------------------------------------------
  // BANNER PROPS
  // --------------------------------------------------

  const props = {
    altLogo,
    fileInputRef,
    fileInputRefLogo,
    HandleDeleteBanner,
    handleInputChangeLogo,
    handleClose,
    handleUpdateBanner,
    handleDeleteLogo,
    isEdit: true,
    isEmtySchedules,
    isLoading,
    isMobile,
    isTablet,
    onTargetClick,
    onTargetClickLogo,

    // El hook mantiene la imagen actual o la vista previa.
    // Inicialmente se establece desde store.banner.
    src,

    // El logo se mantiene completamente independiente.
    srcLogo,

    open: store?.scheduleOpenAll
      ? 'Abierto todos los días'
      : open,

    openNow: store?.scheduleOpenAll
      ? true
      : openNow,

    // No sobrescribimos Image con la imagen del banner.
    store
  }

  return <BannerStore {...props} />
}

export const ManageBanner = memo(Banner)