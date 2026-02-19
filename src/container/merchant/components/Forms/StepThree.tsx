import Link from 'next/link'
import {
  Divider,
  getGlobalStyle,
  Text
} from 'pkg-components'
import React from 'react'

export const StepThree = () => {
  return (
    <div>
      <Text>
        Al crear el comercio, se aceptan los términos y condiciones de uso, así como la política de privacidad. Es importante revisar estos documentos para entender las responsabilidades y derechos asociados con el uso de la plataforma.
      </Text>
      <Text>
        Para más información, puedes consultar los siguientes enlaces:
      </Text>
      <Divider marginTop={getGlobalStyle('--spacing-4xl')} />
      <ul>
        <li>
          <Link
            style={{
              color: getGlobalStyle('--color-secondary-blue')
            }}
            href="#" target="_blank" rel="noopener noreferrer">
            Términos y Condiciones de Uso
          </Link>
        </li>
        <li>
          <Link
            style={{
              color: getGlobalStyle('--color-secondary-blue')
            }}
            href="#" target="_blank" rel="noopener noreferrer">
            Política de Privacidad
          </Link>
        </li>
      </ul>
    </div>
  )
}
