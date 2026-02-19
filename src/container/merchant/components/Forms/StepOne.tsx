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

interface IFormData {
  socialRaz?: string
  documentIdentifier?: string
  nitStore?: string
  catStore?: string
  typeRegiments?: string
  email?: string
  addressStore?: string
  countryId?: string
  code_dId?: string
  ctId?: string
  rId?: string
  neighborhoodStore?: string
  viaPrincipal?: string
  secVia?: string
  uLocation?: string
}

interface IErrorForm {
  socialRaz?: boolean
  documentIdentifier?: boolean
  nitStore?: boolean
  catStore?: boolean
  typeRegiments?: boolean
  email?: boolean
  addressStore?: boolean
  countryId?: boolean
  code_dId?: boolean
  ctId?: boolean
  rId?: boolean
  neighborhoodStore?: boolean
  viaPrincipal?: boolean
  secVia?: boolean
  uLocation?: boolean
}

interface IValues {
  countryId?: string
  code_dId?: string
  ctId?: string
  rId?: string
}

interface IStepOneProps {
  catStore?: Array<{ cName?: string }>
  countries?: Array<{ cName?: string }>
  dataForm?: IFormData
  departments?: Array<{ dName?: string }>
  cities?: Array<{ cName?: string }>
  road?: Array<{ rName?: string }>
  isMobile?: boolean
  errorForm?: IErrorForm
  values?: IValues
  loadingCountries?: boolean
  loadingCatStore?: boolean
  loadingDepartments?: boolean
  loadingCities?: boolean
  handleChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, hasError: boolean) => void
  handleChangeSearch?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

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
}: IStepOneProps) => {
  return (
    <div>
      <InputHooks
        error={errorForm?.socialRaz}
        name='socialRaz'
        onChange={handleChange}
        required
        title='Razón social *'
        value={dataForm?.socialRaz}
        width='100%'
        step={1}
      />
      <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
      <InputHooks
        error={errorForm?.documentIdentifier}
        name='documentIdentifier'
        onChange={(e) => {
          const value = e.target.value.replaceAll(/\D/g, '')
          handleChange({ target: { name: 'documentIdentifier', value } } as React.ChangeEvent<HTMLInputElement>, false)
        }}
        required
        title='Documento de identificación *'
        value={formatWithDots(dataForm?.documentIdentifier as string)}
        width='100%'
        step={1}
      />
      <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <InputHooks
          error={errorForm?.nitStore}
          name='nitStore'
          numeric={true}
          onChange={handleChange}
          required={false}
          title='NIT de la tienda'
          value={dataForm?.nitStore as string}
          width={isMobile ? '80%' : '85%'}
          step={1}
        />
        <InputHooks
          disabled={true}
          name='nitStoreCheckDigit'
          onChange={handleChange}
          required={false}
          step={1}
          value={dataForm?.nitStore ? String(CalcularDigitoVerificacion(dataForm?.nitStore) ?? 0) : ''}
          width={isMobile ? '20%' : '10%'}
        />
      </div>
      <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
      <NewSelect
        error={errorForm?.catStore as boolean}
        id='catStore'
        loading={loadingCatStore}
        name='catStore'
        step={1}
        onChange={(e) => handleChange(e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, false)}
        optionName='cName'
        options={catStore}
        required={true}
        title='Categoría de la tienda'
        value={dataForm?.catStore as string}
      />

      {/* Commented out for future use */}
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
        required={true}
        step={1}
        title='Dirección de la tienda'
        value={dataForm?.addressStore}
        width='100%'
      />
      <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
      <div>
        <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
        <NewSelect
          error={errorForm?.countryId}
          id='cId'
          loading={loadingCountries}
          name='countryId'
          onChange={(e) => handleChangeSearch(e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)}
          optionName='cName'
          options={countries}
          title='Selecciona el país'
          value={values?.countryId}
        />
        <Divider marginBottom={getGlobalStyle('--spacing-lg')} />
        <NewSelect
          error={errorForm?.code_dId}
          id='code_dId'
          loading={loadingDepartments}
          name='code_dId'
          onChange={(e) => handleChangeSearch(e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)}
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
          onChange={(e) => handleChangeSearch(e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)}
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
          onChange={(e) => handleChangeSearch(e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)}
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
            error={errorForm?.viaPrincipal}
            name='viaPrincipal'
            onChange={handleChange}
            required
            title='Vía principal*'
            value={dataForm?.viaPrincipal}
            width='45%'
          />
          <InputHooks
            error={errorForm?.secVia}
            name='secVia'
            onChange={handleChange}
            required
            title='Vía secundaria*'
            value={dataForm?.secVia}
            width='45%'
          />
          <InputHooks
            error={errorForm?.uLocation}
            name='uLocation'
            onChange={handleChange}
            required
            title='Complemento*'
            value={dataForm?.uLocation}
            width='45%'
          />
        </div>
      </div>
    </div>
  )
}
