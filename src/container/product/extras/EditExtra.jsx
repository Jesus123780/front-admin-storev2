import React from 'react'
import PropTypes from 'prop-types'
import { EColor } from '../../../public/colors'
import { IconDelete } from '../../../public/icons'
import {
  InputHooks,
  RippleButton,
  AwesomeModal,
  OptionalExtraProducts
} from 'pkg-components'
import { transformDataToDessert } from 'npm-pkg-hook'
import { ContentModal, GarnishChoicesHeader } from './styled'

export const EditExtra = ({
  openModalCatExtra,
  setOpenModalCatExtra,
  infoExtra,
  handleDeleteCatOptional,
  handleChange,
  dataForm
}) => {
  const initialDataExtra = transformDataToDessert([infoExtra])
  const dissertProps = {
    ...initialDataExtra,
    dataListIds: initialDataExtra?.listIds || [],
    data: initialDataExtra || {}
  }
  return (
    <div>
      <AwesomeModal
        backdrop='backdrop'
        bgColor='transparent'
        btnConfirm={false}
        footer={false}
        header={false}
        onCancel={() => { return setOpenModalCatExtra(false) }}
        onHide={() => { return setOpenModalCatExtra(false) }}
        padding='10px'
        show={openModalCatExtra}
        size='70%'
        zIndex='99988'
      >
        <ContentModal>
          <GarnishChoicesHeader>
            <div>
              <p className='garnish-choices__title'>{infoExtra.pDatCre}</p>z
              <p className='garnish-choices__title'>{infoExtra.OptionalProName}</p>
              <p className='garnish-choices__title-desc'>Escoge hasta {infoExtra.numbersOptionalOnly} opciones.</p>
            </div>
            {infoExtra.required === 1 ? <div className='garnish-choices'>
              <span className='marmita-minitag'>OBLIGATORIO</span>
            </div> : null}
            <RippleButton
              bgColor={'transparent'}
              margin='0px'
              onClick={() => { return handleDeleteCatOptional(infoExtra) }}
              type='button'
              widthButton='min-content'
            >
              <IconDelete color={EColor} size='25px' />
            </RippleButton>
          </GarnishChoicesHeader>
          <InputHooks
            name='OptionalProName'
            onChange={handleChange}
            required
            value={dataForm.OptionalProName}
          />
        </ContentModal>
        <OptionalExtraProducts {...dissertProps} />
      </AwesomeModal>
    </div>
  )
}

EditExtra.propTypes = {
  dataForm: PropTypes.shape({
    OptionalProName: PropTypes.any
  }),
  handleChange: PropTypes.any,
  handleDeleteCatOptional: PropTypes.func,
  infoExtra: PropTypes.shape({
    OptionalProName: PropTypes.any,
    numbersOptionalOnly: PropTypes.any,
    pDatCre: PropTypes.any,
    required: PropTypes.number
  }),
  openModalCatExtra: PropTypes.any,
  setOpenModalCatExtra: PropTypes.func
}
