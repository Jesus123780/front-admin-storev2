import { InputHooks, RippleButton } from 'pkg-components'
import React from 'react'

import { Warper } from '../styled'

export const FormFilterSales = ({
  search = '',
  valuesDates = '',
  handleChangeFilter = () => { return },
  handleCleanFilter = () => { return },
  onChangeInput = (e) => { return e }
}) => {
  return (
    <Warper>
      <InputHooks
        name='fromDate'
        onChange={onChangeInput}
        radius='20px'
        required
        title='Desde'
        type='date'
        value={valuesDates?.fromDate}
        width={'20%'}
      />
      <InputHooks
        name='toDate'
        onChange={onChangeInput}
        radius='20px'
        required
        title='Hasta'
        type='date'
        value={valuesDates?.toDate}
        width='20%'
      />
      <RippleButton
        onClick={handleCleanFilter}
        padding='0'
        radius='20px'
        widthButton='20%'
      >
        Limpiar
      </RippleButton>

      <InputHooks
        name='search'
        onChange={handleChangeFilter}
        radius='20px'
        range={{ min: 0, max: 20 }}
        title='Busca tus productos'
        type='text'
        value={search}
        width='100%'
      />
    </Warper>
  )
}