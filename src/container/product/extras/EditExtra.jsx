import PropTypes from 'prop-types'
import {
  InputHooks,
  RippleButton,
  AwesomeModal,
  OptionalExtraProducts,
  ChoicesHeader
} from 'pkg-components'
import { transformDataToDessert } from 'npm-pkg-hook'
import { ContentModal } from './styled'

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
          <ChoicesHeader
            title={infoExtra.OptionalProName}
            descrition={`Escoge hasta ${infoExtra.numbersOptionalOnly} opciones.`}
            label={infoExtra.required === 1 ? 'OBLIGATORIO' : ''}
            deleting={true}
            handleDelete={() => { return handleDeleteCatOptional(infoExtra) }}
          />
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
