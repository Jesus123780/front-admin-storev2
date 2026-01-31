import { InputHooks, RippleButton } from 'pkg-components'
import React from 'react'


export const FormFilterSales = ({
  search = '',
  valuesDates = '',
  handleChangeFilter = () => { return },
  handleCleanFilter = () => { return },
  onChangeInput = (e) => { return e }
}) => {
  return (
    <div>
      <InputHooks
        name='fromDate'
        onChange={onChangeInput}
        required
        title='Desde'
        value={valuesDates?.fromDate}
        width={'20%'}
      />
      <InputHooks
        name='toDate'
        onChange={onChangeInput}
        required
        title='Hasta'
        value={valuesDates?.toDate}
        width='20%'
      />
      <RippleButton
        onClick={handleCleanFilter}
        padding='0'
        radius='20px'
      >
        Limpiar
      </RippleButton>

      <InputHooks
        name='search'
        onChange={handleChangeFilter}
        range={{ min: 0, max: 20 }}
        title='Busca tus productos'
        type='text'
        value={search}
        width='100%'
      />
    </div>
  )
}