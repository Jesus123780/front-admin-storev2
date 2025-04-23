'use client'

import PropTypes from 'prop-types'
import {
  Button,
  Divider,
  getGlobalStyle,
  HeaderSteps,
  InputFiles,
  Row,
  Text
} from 'pkg-components'
import React, { useContext } from 'react'
import {
  useUploadProducts,
  useUpdateMultipleProducts,
  GenerateReport
} from 'npm-pkg-hook'
import { ListData } from './ListData'
import { Context } from '../../../../context/Context'
import { TemplateDownloader } from './TemplateDownloader'
import { excelData, generateBarcode } from './helpers'
import styles from './styles.module.css'

export const UploadFilesProducts = ({
  handleClick = () => { return }
}) => {
  const { sendNotification } = useContext(Context)
  const {
    active,
    handleOverActive,
    isLoading,
    overActive,
    onChangeFiles,
    STEPS,
    data,
    handleCleanAllProducts,
    filterInvalidQuantityProducts,
    getUploadResults,
    handleCancelUpdateQuantity,
    handleToggleEditingStatus,
    handleSuccessUpdateQuantity,
    handleChangeQuantity,
    updateProductQuantity,
    handleCheckFree,
    setActive
  } = useUploadProducts({
    sendNotification
  })

  const { updateProducts, loading } = useUpdateMultipleProducts({
    sendNotification
  })
  const steps = ['SUBIR ARCHIVOS', `LISTAR PRODUCTOS (${Number(data?.length) ?? 0})`]

  const handleDownloadTemplate = () => {
    const GenReporte = new GenerateReport()
    GenReporte.GenExcelReport(excelData.map(item => {
      return {
        ...item,
        CODIGO_DE_BARRAS: generateBarcode()
      }
    }), 1)
  }

  const removeAllFiles = () => {
    handleCleanAllProducts()
  }

  const removeLastFile = () => {
    handleCleanAllProducts()
  }

  const handleSubmit = async () => {
    if (active === STEPS.UPLOAD_PRODUCTS) {
      filterInvalidQuantityProducts()
      const response = await updateProducts(data)

      if (response) {
        const { successfullyUploaded, failedUploads } = getUploadResults(data, response)
        const successfullyUploadedLength = successfullyUploaded.length

        // Notificación de errores individuales con un pequeño retraso
        if (failedUploads.length > 0) {
          failedUploads.forEach((upload, index) => {
            setTimeout(() => {
              sendNotification({
                description: `Error al subir el producto ${upload?.NOMBRE ?? 'sin nombre'}`,
                title: 'Error al subir',
                backgroundColor: 'error'
              })
            }, index * 500) // Retraso de 500ms entre notificaciones
          })
        }

        // Notificación general de resultados de subida
        sendNotification({
          description: successfullyUploadedLength > 0
            ? `Se subieron ${successfullyUploadedLength} productos correctamente.`
            : `No se subieron productos correctamente, verifica y vuelve a intentarlo.`,
          title: successfullyUploadedLength > 0 ? 'Success' : 'No se subieron productos',
          backgroundColor: successfullyUploadedLength > 0 ? 'success' : 'error'
        })

        // Limpieza de productos si hubo subidas exitosas
        if (successfullyUploadedLength > 0) {
          handleCleanAllProducts()
          setActive(STEPS.UPLOAD_FILE)
        }
      }
    } else if (active === STEPS.UPLOAD_FILE) {
      setActive(STEPS.UPLOAD_PRODUCTS)
    }
  }


  const components = {
    0: <div style={{ width: '60%', margin: 'auto' }}>
      <InputFiles
        allowedFileTypes={['.xlsx', '.xls', '.csv', '.xlsm', '.xlsb', '.xltx', '.xltm', '.txt']}
        limit={1}
        onChange={onChangeFiles}
        removeAllFiles={removeAllFiles}
        removeLastFile={removeLastFile}
        sendNotification={sendNotification}
      />
      <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
      <TemplateDownloader handleDownloadTemplate={handleDownloadTemplate} />
    </div>,
    1: <ListData
      data={data}
      handleCancelUpdateQuantity={handleCancelUpdateQuantity}
      handleChangeQuantity={handleChangeQuantity}
      handleCheckFree={handleCheckFree}
      handleSuccessUpdateQuantity={handleSuccessUpdateQuantity}
      handleToggleEditingStatus={handleToggleEditingStatus}
      updateProductQuantity={updateProductQuantity}
    />
  }
  const disabled = {
    0: !data.length,
    1: false
  }
  const showButtonCancel = {
    0: true,
    1: false
  }
  return (
    <div className={styles.container} >
      <div>
        <Text as='h2' size='3xl'>
          Importar productos
        </Text>
        <Text size='md'>
          Importar los productos de tu tienda en un archivo Excel,
          Si algun producto tiene un codigo de barras ya existente, se actualizara la cantidad en stock
        </Text>
        <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
        <HeaderSteps
          active={active}
          handleOverActive={handleOverActive}
          overActive={overActive}
          setActive={setActive}
          steps={steps}
        />
        <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
        {components[active]}
        <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
        <Row
          justifyContent='end'
          style={{
            margin: 'auto',
            width: active === STEPS.UPLOAD_FILE ? '60%' : '100%',
            justifyContent: 'flex-end'
          }}
        >
          {showButtonCancel[active] &&
          <Button
            onClick={() => {
              handleClick(false)
            }}
          >
            Cancelar
          </Button>
          }
          {active === STEPS.UPLOAD_PRODUCTS &&
          <Button
            disabled={active === STEPS.UPLOAD_FILE}
            onClick={() => {
              if (active === STEPS.UPLOAD_PRODUCTS) {
                return handleCleanAllProducts()
              }
              return null
            }}
            primary
            styles={{
              marginLeft: 'var(--spacing-md)'
            }}
          >
            Eliminar todo
          </Button>
          }
          <Button
            disabled={disabled[active]}
            loading={isLoading || loading}
            onClick={handleSubmit}
            primary
            styles={{
              marginLeft: getGlobalStyle('--spacing-md')
            }}
          >
            {active === STEPS.UPLOAD_PRODUCTS ? 'Finalizar' : 'Siguiente'}
          </Button>
        </Row>
      </div>
    </div >
  )
}

UploadFilesProducts.propTypes = {
  handleClick: PropTypes.func
}
