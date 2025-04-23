'use client'

import React from 'react'
import PropTypes from 'prop-types'
import { EColor, NorthTexasGreen, Checkbox, RippleButton, Icon } from 'pkg-components'
import { CardsComponent, GarnishChoicesHeader } from './styled'

export const Optional = ({
  editing,
  loading = false,
  dataOptional = [],
  handleLineChange = () => { return },
  handlersPropsOptional = {
    handleAddOptional: ({
      exOptional,
      codeCategory,
      index
    }) => { return {
      exOptional,
      codeCategory,
      index
    } }
  },
  handleDeleteItemSubOptional = () => { return }
}) => {
  const { handleAddOptional } = handlersPropsOptional || {}

  return (
    <div>
      {dataOptional?.length > 0 && dataOptional?.map((x, i) => {
        return (
          <div key={x.opExPid}>
            <GarnishChoicesHeader>
              <div>
                <p className='garnish-choices__title'>{x.OptionalProName}</p>
                {!!x.numbersOptionalOnly && <p className='garnish-choices__title-desc'>Escoge hasta {x.numbersOptionalOnly} opciones.</p>}
              </div>
              <div className='garnish-choices'>
                <Icon icon='IconMiniCheck' color={NorthTexasGreen} size={15} />
                {x.required ? <span className='marmita-minitag'>OBLIGATORIO</span> : <span className='marmita-minitag' style={{ backgroundColor: 'transparent', color: 'transparent', width: '8  0px', zIndex: '0' }}>OBLIGATORIO</span>}
              </div>
              {loading && '...Cargando'}
            </GarnishChoicesHeader>
            {
              x?.ExtProductFoodsSubOptionalAll?.map((z, index) => {
                return (
                  <CardsComponent key={z.opSubExPid}>
                    <div>
                      <h3 className='title_card'>{z?.OptionalSubProName}</h3>
                      <h3 className='title_card'>Item: {index + 1}</h3>
                    </div>
                    {editing &&
                    <RippleButton
                      bgColor='transparent'
                      margin='0px'
                      onClick={() => { return handleDeleteItemSubOptional(z) }}
                      type='button'
                      widthButton='min-content'
                    >
                      <Icon icon='IconDelete' color={EColor} size={25} />
                    </RippleButton>
                    }
                    {!editing &&
                      <Checkbox
                        checked={z?.check || false}
                        id={z.opSubExPid}
                        margin='10px 0'
                        name='opSubExPid'
                        onChange={value => { return editing ?
                          handleLineChange(i, 'exState', value) :
                          handleAddOptional({ exOptional: z.opSubExPid, codeCategory: x?.code, index })
                        }}
                        value={z.opSubExPid}
                      />
                    }
                  </CardsComponent>
                )
              })
            }
          </div >
        )
      })}
    </div>
  )
}

Optional.propTypes = {
  dataOptional: PropTypes.array,
  editing: PropTypes.bool,
  handleDeleteItemSubOptional: PropTypes.func,
  handleLineChange: PropTypes.func,
  handleOpenExtra: PropTypes.func,
  handlersPropsOptional: PropTypes.object,
  loading: PropTypes.bool
}
