import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components'
import { Placeholder } from 'pkg-components'
import { PColor } from '@/public/colors'
import Image from 'next/image'

export const ImageItem = ({
  showImge = true,
  src = '',
  alt = '',
  onClick = () => { return }
}) => {
  return (
    <Container>
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
    </Container>
  )
}

ImageItem.propTypes = {
  alt: PropTypes.any,
  onClick: PropTypes.any,
  showImge: PropTypes.any,
  src: PropTypes.any
}

const Container = styled.div`
    min-height: 150px;
    max-height: 300px;
    overflow: hidden auto;
    cursor: pointer;
    border: 2px dashed rgba(0,0,0,0.1);
    border-radius: 12px;
    display: grid;
    place-content: center;
    img {
      width: 100%;
      height: 100%;
      object-fit: scale-down;
      /* min-height: 150px; */
      /* max-height: 300px; */
    }
    .button {
    border: 1px solid ${PColor};
    padding: 5px;
    width: 300px;
    cursor: pointer;
    border-radius: 5px;
    margin: auto;
    background-color: transparent;
    border-radius: 5px;
  }
  .button_icon {
    font-family: PFont-Light;
    text-align: center;
  }
`