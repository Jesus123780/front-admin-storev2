import {
  Divider,
  getGlobalStyle,
  InputHooks,
  PhoneInput
} from 'pkg-components'

interface DataForm {
  storeOwner: string
  storeName: string
  email: string
  uPhoNum: string
}

interface DataUser {
  email: string
}

interface ErrorForm {
  storeOwner?: string
  storeName?: string
  email?: string
  uPhoNum?: string
}

interface StepCeroProps {
  dataForm?: DataForm
  dataUser?: DataUser
  email?: string
  errorForm?: ErrorForm
  handleChange?: (event: { target: { name: string; value: string } }) => void
}

export const StepCero = ({
  dataForm = {
    storeOwner: '',
    storeName: '',
    email: '',
    uPhoNum: ''
  },
  dataUser = {
    email: ''
  },
  email = '',
  errorForm = {},
  handleChange = () => { return }
}: StepCeroProps) => {
  return (
    <div>
      <div>
        <InputHooks
          error={errorForm?.storeOwner}
          name='storeOwner'
          onChange={handleChange}
          required
          title='Nombre del dueño de la tienda *'
          value={dataForm?.storeOwner}
          width='100%'
          step={0}
        />
        <Divider marginBottom={getGlobalStyle('--spacing-2xl')} />
        <InputHooks
          error={errorForm?.storeName}
          name='storeName'
          onChange={handleChange}
          required
          title='Nombre de la tienda *'
          value={dataForm?.storeName}
          width='100%'
          step={0}
        />
        <Divider marginTop={getGlobalStyle('--spacing-2xl')} />
        <InputHooks
          disabled={true}
          error={errorForm?.email}
          name='email'
          onChange={handleChange}
          required
          title='Correo.'
          value={email ?? dataUser?.email}
          width='100%'
          step={0}
        />
        <PhoneInput
          name='uPhoNum'
          step={0}
          error={Boolean(errorForm?.uPhoNum)}
          title='Número de teléfono *'
          value={dataForm?.uPhoNum}
          onChange={(value) => {
            const event = {
              target: {
                name: 'uPhoNum',
                value
              }
            }
            handleChange?.(event)
          }}
          required={true}
        />
      </div>
    </div>
  )
}
