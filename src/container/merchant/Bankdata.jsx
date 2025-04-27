import { useFormTools } from 'npm-pkg-hook'
import { InputHooks } from 'pkg-components'
import { ContentCards } from './styled'

const Bankdata = () => {
  // eslint-disable-next-line
  const [handleChange, handleSubmit, setDataValue, { dataForm, errorForm }] = useFormTools()

  return (
    <ContentCards>
      <InputHooks
        error={errorForm?.email}
        name='email'
        onChange={handleChange}
        required
        title='Banco'
        value={dataForm?.email}
        width='100%'
      />
      <InputHooks
        error={errorForm?.email}
        name='email'
        onChange={handleChange}
        required
        title='Tipo de cuenta'
        value={dataForm?.email}
        width='100%'
      />
      <InputHooks
        error={errorForm?.email}
        name='email'
        onChange={handleChange}
        required
        title='Nombre del Representante Legal'
        value={dataForm?.email}
        width='100%'
      />
      <InputHooks
        error={errorForm?.email}
        name='email'
        onChange={handleChange}
        required
        title='Número de cuenta bancaria'
        value={dataForm?.email}
        width='100%'
      />
      <InputHooks
        error={errorForm?.email}
        name='email'
        onChange={handleChange}
        required
        title='Banco'
        value={dataForm?.email}
        width='100%'
      />
    </ContentCards>
  )
}

Bankdata.propTypes = {

}

export default Bankdata
