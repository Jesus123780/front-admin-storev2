import {
  InputHooks,
  AwesomeModal,
  OptionalExtraProducts,
  ChoicesHeader
} from 'pkg-components'
import { transformDataToDessert } from 'npm-pkg-hook'

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
        <div>
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
        </div>
        <OptionalExtraProducts {...dissertProps} />
      </AwesomeModal>
    </div>
  )
}
