import { useState } from 'react'
import { RippleButton } from 'pkg-components'
import { BColor, EColor } from '../../public/colors'
import {
  Card2,
  ContentCardInfo,
  Text
} from './styled'
import { useStore, useUser } from 'npm-pkg-hook'
import { useRouter } from 'next/router'

const CheckYourData = () => {
  const [step] = useState(0)
  const [dataUser] = useUser()
  const router = useRouter()
  const [data] = useStore()
  const store = data || {}
  const handleRedirect = () => {
    router.push('/restaurante/contract')
  }
  return (
    <div>
      <ContentCardInfo>
        <h1>Antes de terminar, revisa tus datos</h1>
        <Card2>
          <div>
            <Text color={BColor} size='15px'>Nombre del restaurante </Text>
            <Text color={BColor} size='15px'>{store?.storeName}</Text>
          </div>
          <div>
            <Text color={BColor} size='15px'>NIT </Text>
            <Text color={BColor} size='15px'>{store?.NitStore}</Text>
          </div>

        </Card2>
        <Card2>
          <div>
            <Text color={BColor} size='15px'>Documento de identidad </Text>
            <Text color={BColor} size='15px'>{store?.documentIdentifier}</Text>
          </div>
          <div>
            <Text color={BColor} size='15px'>Email Store </Text>
            <Text color={BColor} size='15px'>{store?.emailStore}</Text>
          </div>
        </Card2>
        <Card2>
          <div>
            <div>
              <Text color={BColor} size='15px'>Información del representante legal </Text>
              {/* <Text size='15px' color={BColor}>{store?.NitStore}</Text> */}
            </div>

          </div>
          <div>
            {dataUser?.email || ''}
          </div>
        </Card2>
        <Card2>
          <div>
            <div>
              <Text color={BColor} size='15px'>Dirección</Text>
              <Text color={BColor} size='15px'>{store?.addressStore}</Text>
            </div>
          </div>
        </Card2>
        <Card2>
          <div>
                        Numero
          </div>
          {store.uPhoNum}
        </Card2>
        <Card2>
          <div>
            <Text color={BColor} size='15px'>  Descripcion </Text>
            <Text color={BColor} size='15px'>{store?.description}</Text>
          </div>
          <div>
            <Text color={BColor} size='15px'>Categoría </Text>
            <Text color={BColor} size='15px'>{store?.cateStore?.cName}</Text>
          </div>

        </Card2>
        <RippleButton
          bgColor={EColor}
          margin='20px auto'
          onClick={() => {return handleRedirect()}}
          type='submit'
          widthButton='100%'
        >{step !== 1 ? 'Continuar' : 'Finalizar'}</RippleButton>
        {/* <RippleButton
          bgColor={PVColor}
          color={BGColor}
          onClick={() => {return generatePdfDocumentInvoice({ dataInvoice: { ...data } })}}
          padding={'15px 5px'}
          widthButton='150px'
        >
                    Download
        </RippleButton> */}
      </ContentCardInfo>
    </div>
  )
}

CheckYourData.propTypes = {

}

export default CheckYourData
