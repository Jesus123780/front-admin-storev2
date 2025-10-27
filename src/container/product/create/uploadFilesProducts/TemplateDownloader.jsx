'use client'

import {
  Button,
  Column,
  Divider,
  getGlobalStyle,
  Icon,
  Paragraph,
  Row,
  Text
} from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'

import styles from './styles.module.css'

export const TemplateDownloader = ({
  handleDownloadTemplate = () => { return }
}) => {
  return (
    <div className={styles.container_template}>
      <Row alignItems='center' >
        <Column justifyContent='center'>
          <Row alignItems='center' >
            <Icon icon='IconExcel' size={30} />
            <Text size='md' weight='extrabold'>
                            Descarga la plantilla para crear productos
            </Text>
          </Row>
          <Divider marginBottom='var(--spacing-sm)' />
          <Paragraph>
                        Puedes descargar el ejemplo adjunto y utilizar
                        como punto de partida para su propio archivo.
          </Paragraph>
        </Column>
        <Button
          borderRadius={getGlobalStyle('--border-radius-sm')}
          className={styles.download_button}
          onClick={() => {
            handleDownloadTemplate()
          }}
        >
                    Descargar
        </Button>
      </Row>
    </div>
  )
}

TemplateDownloader.propTypes = {
  handleDownloadTemplate: PropTypes.func
}
