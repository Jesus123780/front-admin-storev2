'use client'

import {
  AwesomeModal,
  Button,
  getGlobalStyle
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React, { useState } from 'react'

import { useOrderTypes } from '../context'
import { StatusTypeOrderCreate } from '../create'
import { ListOrderStatusTypes } from './components/ListOrderStatusTypes'

export const StatusTypeOrderView = () => {
  const { data } = useOrderTypes()
  const [ShowStatusTypes, setShowStatusTypes] = useState(false)
  const handlePageChange = (pageNumber: number) => {
    return pageNumber
  }

  return (
    <React.Fragment>
      <AwesomeModal
        footer={false}
        header={true}
        size={MODAL_SIZES.medium}
        onCancel={() => {
          return false
        }}
        onHide={() => setShowStatusTypes(false)}
        padding={20}
        title='Crear nuevo estado de orden'
        show={ShowStatusTypes}
        customHeight='auto'
        zIndex={getGlobalStyle('--z-index-99999')}
      >
        <StatusTypeOrderCreate />
      </AwesomeModal>
      <Button onClick={() => { return setShowStatusTypes(!ShowStatusTypes) }}>
        Crear
      </Button>
      <ListOrderStatusTypes handlePageChange={handlePageChange} data={data} />
    </React.Fragment>
  )
}
