import {
  AwesomeModal,
  getGlobalStyle,
  InputDate,
  Row,
  ToggleSwitch,
} from 'pkg-components'
import React from 'react'

import styles from '../styles.module.css'

interface ModalQueriesProps {
  open: boolean
  inCludeRange: boolean
  dataForm: {
    fromDate: Date
    toDate: Date
  }
  setInCludeRange: (value: boolean) => void
  handleChange: (e: { target: { name: string; value: unknown } }) => void
  onClose: () => void
}

export const ModalQueries: React.FC<ModalQueriesProps> = ({
  open,
  inCludeRange,
  dataForm,
  setInCludeRange,
  handleChange,
  onClose
}) => {
  return (
    <AwesomeModal
      show={open}
      title='Filtros de búsqueda'
      height={'calc(50% + 40px)'}
      customHeight={'calc(100% - 40px)'}
      padding={getGlobalStyle('--spacing-xl')}
      onCancel={onClose}
      onHide={onClose}
      onConfirm={onClose}
    >
      <div className={styles['quick-filters']}>
        {!inCludeRange && (
          <ToggleSwitch
            checked={inCludeRange}
            id='include-range'
            label='Incluir rango de fechas en la búsqueda'
            onChange={() => setInCludeRange(!inCludeRange)}
            successColor='green'
          />
        )}
        <Row>
          <InputDate
            date={dataForm.fromDate}
            label='Desde'
            disabled={!inCludeRange}
            onChange={(value) =>
              handleChange({
                target: {
                  name: 'fromDate',
                  value,
                },
              })
            }
            value={dataForm.fromDate}
          />
          <InputDate
            disabled={!inCludeRange}
            date={dataForm.toDate}
            label='Hasta'
            onChange={(value) =>
              handleChange({
                target: {
                  name: 'toDate',
                  value,
                },
              })
            }
            value={dataForm.toDate}
          />
        </Row>
      </div>
    </AwesomeModal>
  )
}
