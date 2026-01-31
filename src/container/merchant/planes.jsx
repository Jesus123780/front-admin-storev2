import { useEffect, useState } from 'react'
import { RippleButton, ActiveLink, Text } from 'pkg-components'
import {
  BColor,
  BGColor,
  SECColor
} from '../../public/colors'
import { IconArrowBottom, IconCancel } from '../../public/icons'

const Planes = () => {
  const show = useState(0)
  const Switch = useState(0)

  useEffect(() => {
    if (show) window.addEventListener('keyup', e => { return e.code === 'Escape' && show.setState(false) })
    return () => { return window.removeEventListener('keyup', () => { return }) }
  }, [show])
  return (
    <div>
      <div>
        <Text
          bold='600'
          color={SECColor}
          font='PFont-Regular'
          justify='center'
          lineHeight={'2.75rem'}
          margin='0 .625rem'
          size='1.5rem'
          width='auto'
        >
          Monthly
        </Text>
        <button onClick={() => { return Switch.setState(!Switch.state) }}>
          <SwitchButton active={Switch.state ? '36px' : '3.5px'} />
        </button>
        <Text
          bold='600'
          color={SECColor}
          font='PFont-Regular'
          justify='center'
          lineHeight={'2.75rem'}
          margin='0 .625rem'
          size='1.5rem'
          width='auto'
        >Annual</Text>
      </div>
      <div>

        <div>
          <div>
            {[1, 2]?.map(x => {
              return (
                <>
                  <div
                    alignContent='flex-start'
                    justify='flex-start'
                    key={x._id}
                    margin='1.5rem .625rem 0'
                    maxWidth='16.5625rem'
                    overflow='hidden'
                    padding='20px 20px'
                    radius='5px'
                    shadow='0 0.125rem 0.5rem 0 rgb(0 0 0 / 20%)'
                    width='100vw'
                  >
                    <Text
                      bold='500'
                      color={BColor}
                      lineHeight='1.4'
                      size='1.25rem'
                    >
                      {x.LName}
                    </Text>
                    <div />
                    <div>
                      <s>
                        {x.LDescuento ? `£ ${x.LDescuento}` : '£ 16'}
                      </s>
                    </div>
                    <ContentPrice>
                      <Text
                        bold='700'
                        color={SECColor}
                        font='PFont-Bold'
                        lineHeight={'1.3'}
                        margin='.5rem 0'
                        size='2.5rem'
                      >{'£ 2'}</Text>
                    </ContentPrice>
                    <ActiveLink activeClassName='active' href={`/restaurante/revisa-tus-datos`}>
                      <a>
                        <RippleButton
                          bgColor={'#0e8900'}
                          border='624.9375rem'
                          color={BGColor}
                          family='PFont-Medium'
                          margin='0px 10px 20px 0px'
                          widthButton='150px'
                        >comprar ahora</RippleButton>
                      </a>
                    </ActiveLink>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(z => {
                      return (
                        <div key={z._id}>
                          <FeatureItem>
                            <IconArrowBottom color={BColor} size='17px' />
                            <BtnItem
                              onClick={() => { return show.setState(x === show.state ? false : x) }}
                              overflow
                              style={{ fontSize: '1.25rem' }}
                            >{z.lineItemsDescription}</BtnItem>
                          </FeatureItem>
                        </div>
                      )
                    })}
                  </div>
                  <ModuleInfo show={true}>
                    <Module>
                      <BtnClose onClick={() => { return show.setState(false) }}>
                        <IconCancel size='20px' />
                      </BtnClose>
                      <Text
                        bold='600'
                        color={SECColor}
                        lineHeight='1.4'
                        margin='2.5rem 0 0'
                        size='2rem'
                      >Track income & expenses</Text>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(z => {
                        return (
                          <ul key={z._id}>
                            <li >{z.lineItemsDescription}</li>
                          </ul>
                        )
                      })}
                    </Module>
                  </ModuleInfo>
                </>

              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

Planes.propTypes = {

}

export default Planes
