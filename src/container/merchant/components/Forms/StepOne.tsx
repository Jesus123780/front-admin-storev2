import {
  Divider,
  getGlobalStyle,
  InputHooks,
  NewSelect,
  Text
} from 'pkg-components'
import React from 'react'

import { CalcularDigitoVerificacion } from '@/utils'

import { formatWithDots } from '../../helpers/formatWithDots'


export const StepOne = ({
  catStore = [],
  countries = [],
  dataForm = {},
  departments = [],
  cities = [],
  road = [],
  isMobile = false,
  errorForm = {},
  values = {},
  loadingCountries = false,
  loadingCatStore = false,
  loadingDepartments = false,
  loadingCities = false,
  handleChange = () => { return },
  handleChangeSearch = () => { return },
  handleBlur = () => { return }
}) => {
  return (
    <div>
      <InputHooks
        error={errorForm?.socialRaz}
        name='socialRaz'
        onChange={handleChange}
        required
        title='Razon social'
        value={dataForm?.socialRaz}
        width='100%'
      />
      <InputHooks
        error={errorForm?.documentIdentifier}
        name='documentIdentifier'
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '')
          handleChange({ target: { name: 'documentIdentifier', value } })
        }}
        required
        title='Documento de identificación'
        value={formatWithDots(dataForm?.documentIdentifier)}
        width='100%'
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <InputHooks
          error={errorForm?.NitStore}
          name='NitStore'
          numeric={true}
          onChange={handleChange}
          required={true}
          title='Nit de la tienda'
          value={dataForm?.NitStore}
          width={isMobile ? '80%' : '85%'}
        />
        <InputHooks
          disabled={true}
          name='NitStore'
          onChange={handleChange}
          required={false}
          value={dataForm?.NitStore ? Number(CalcularDigitoVerificacion(dataForm?.NitStore) ?? 0) : 0}
          width={isMobile ? '20%' : '10%'}
        />
      </div>
      <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
      <NewSelect
        error={errorForm?.catStore}
        id='catStore'
        loading={loadingCatStore}
        name='catStore'
        onChange={handleChange}
        optionName='cName'
        options={catStore}
        required
        title='Categoría de la tienda *'
        value={dataForm?.catStore}
      />

      {false && <>
        <InputHooks
          error={errorForm?.typeRegiments}
          name='typeRegiments'
          onChange={handleChange}
          title='Tipo de Regimen'
          value={dataForm?.typeRegiments}
          width='100%'
        />
        <InputHooks
          error={errorForm?.email}
          name='email'
          onChange={handleChange}
          title='Tipo de Contribuyente'
          value={dataForm?.email}
          width='100%'
        />
      </>
      }
      <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
      <Text
        as='h2'
        color='primary'
        size='3xl'
      >
        Dirección de la tienda
      </Text>
      <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
      <InputHooks
        error={errorForm?.addressStore}
        name='addressStore'
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleBlur}
        padding='15px 0'
        title='Dirección de la tienda'
        value={dataForm?.addressStore}
        width='100%'
      />
      <div>
        <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
        <NewSelect
          error={errorForm?.countryId}
          id='cId'
          loading={loadingCountries}
          name='countryId'
          onChange={handleChangeSearch}
          optionName='cName'
          options={countries}
          title='País'
          value={values?.countryId}
        />
        <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
        <NewSelect
          error={errorForm?.code_dId}
          id='code_dId'
          loading={loadingDepartments}
          name='code_dId'
          onChange={handleChangeSearch}
          optionName='dName'
          options={departments}
          title='Departamento'
          value={values?.code_dId}
        />
        <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
        <NewSelect
          error={errorForm?.ctId}
          id='ctId'
          loading={loadingCities}
          name='ctId'
          onChange={handleChangeSearch}
          optionName='cName'
          options={cities ?? []}
          title='Ciudad'
          value={values?.ctId}
        />
        <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
        <NewSelect
          error={errorForm?.rId}
          id='rId'
          name='rId'
          onChange={handleChangeSearch}
          optionName='rName'
          options={road}
          title='Tipo de via'
          value={values?.rId}
        />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: getGlobalStyle('--spacing-xs') }}>
          <InputHooks
            error={errorForm?.neighborhoodStore}
            name='neighborhoodStore'
            onChange={handleChange}
            required
            title='Barrio*'
            value={dataForm?.neighborhoodStore}
            width='45%'

          />
          <InputHooks
            error={errorForm?.Viaprincipal}
            name='Viaprincipal'
            onChange={handleChange}
            required
            title='Via principal*'
            value={dataForm?.Viaprincipal}
            width='45%'

          />
          <InputHooks
            error={errorForm?.secVia}
            name='secVia'
            onChange={handleChange}
            required
            title='Via secundaria*'
            value={dataForm?.secVia}
            width='45%'

          />
          <InputHooks
            error={errorForm?.ULocation}
            name='ULocation'
            onChange={handleChange}
            required
            title='Complemento*'
            value={dataForm?.ULocation}
            width='45%'
          />
        </div>
      </div>
    </div>
  )
}
