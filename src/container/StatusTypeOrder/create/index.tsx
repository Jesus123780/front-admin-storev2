import { useCreateOrderStatusType, useFormTools } from 'npm-pkg-hook'
import {
  Column,
  InputColor,
  InputHooks,
  RippleButton
} from 'pkg-components'
import { useContext } from 'react'

import { Context } from '@/context/Context'

import styles from './styles.module.css'

export const StatusTypeOrderCreate = () => {
  const [handleChange, handleSubmit, handleForcedData, { dataForm, errorForm }] = useFormTools()
  const { sendNotification } = useContext(Context)
  const [handleCreate, { loading }] = useCreateOrderStatusType({
    sendNotification
  })

  const handleForm = (e: React.FormEvent<HTMLFormElement>) => {
    return handleSubmit({
      event: e,
      action: async () => {
        const {
          name,
          description,
          color
        } = dataForm
        return handleCreate({
          name,
          description,
          color,
          priority: 1,
          state: 1
        })
      },
      actionAfterSuccess: () => {
        handleForcedData({})
      }
    })
  }
  return (
    <form onSubmit={handleForm}>
      <Column className={styles['form-container']}>
        <InputHooks
          error={errorForm?.name}
          name='name'
          onChange={handleChange}
          required
          title='Nombre del estado de la orden'
          value={dataForm?.name}
          width='100%'
        />
        <InputHooks
          error={errorForm?.description}
          name='description'
          onChange={handleChange}
          title='Descripción del estado de la orden'
          value={dataForm?.description}
          width='100%'
        />
        <InputColor
          position='top'
          onChange={(value: string) => {
            return handleChange({
              target: {
                name: 'color',
                value
              }
            } as React.ChangeEvent<HTMLInputElement>)
          }}
          label='Color del estado de la orden'
          value={dataForm?.color}
        />
        <RippleButton loading={loading} type='submit'>
          Guardar
        </RippleButton>
      </Column>
    </form>
  )
}
