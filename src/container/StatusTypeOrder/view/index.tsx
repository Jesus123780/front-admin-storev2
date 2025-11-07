'use client'

import { useOrderStatusTypes } from 'npm-pkg-hook'
import {
 AwesomeModal, 
 Button, 
 getGlobalStyle 
} from 'pkg-components'
import { MODAL_SIZES } from 'pkg-components/stories/organisms/AwesomeModal/constanst'
import React, {
  useContext,
  useState
} from 'react'

import { Context } from '../../../context/Context'
import { StatusTypeOrderCreate } from '../create'

export const StatusTypeOrderView = () => {
  const [data, setData] = useState<unknown>([])
  const { sendNotification } = useContext(Context)
  useOrderStatusTypes({
    callback: (data: unknown) => {
      return setData(data)
    }
  })

  const [ShowStatusTypes, setShowStatusTypes] = useState(false)


  return (
    <>
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
    </>
  )
}
