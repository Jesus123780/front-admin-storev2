import { Column, Placeholder } from 'pkg-components'
import Image from 'next/image'

export const ImageItem = ({
  showImge = true,
  src = '',
  alt = '',
  onClick = () => { return }
}) => {
  return (
    <Column>
      {(src && showImge) ?
        <>
          <Image
            alt={alt}
            height={100}
            src={src}
            width={300}
          />
          <button className='button' onClick={onClick}>
            <div className='button_icon'>
              Escoge una imagen
            </div>
          </button>
        </>

        :
        <Placeholder onClick={onClick} />
      }
    </Column>
  )
}
