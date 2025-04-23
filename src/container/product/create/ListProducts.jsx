import PropTypes from 'prop-types'
import React from 'react'
import { 
  Skeleton, 
  RippleButton,
  Text,
  MemoCardProductSimple
} from 'pkg-components'
import {
  ContainerCardProduct,
  ContentProducts,
  WrapperProducts
} from './styled'

export const ListProducts = ({
  data,
  pState,
  handleDelete,
  showMore,
  fetchMore,
  loading,
  setShowMore
}) => {
  const isData = Boolean(data?.length > 0)
  return (
    <div>
      <ContentProducts>
        {isData && <Text>Lista de productos registrados {pState === 1 ? 'Activos' : 'Desactivados'}</Text>}
        <WrapperProducts className='filter'>
          <ContainerCardProduct>
            {!isData ? <Skeleton height='400' numberObject={8} /> : data?.map(producto => {
              return (
                <MemoCardProductSimple
                  {...producto}
                  del={true}
                  edit={true}
                  handleDelete={() => {return handleDelete(producto)}}
                  key={producto.pId}
                />
              )
            })}
          </ContainerCardProduct>
        </WrapperProducts>
        {isData && <RippleButton
          margin='20px auto'
          onClick={() => {
            setShowMore(s => { return s + 5 })
            fetchMore({
              variables: { max: showMore, min: 0 },
              updateQuery: (prevResult, { fetchMoreResult }) => {
                if (!fetchMoreResult) return prevResult
                return {
                  productFoodsAll: [...fetchMoreResult.productFoodsAll]

                }
              }
            })
          }}
          widthButton='100%'
        >{loading ? 'Cargando...' : 'CARGAR MÁS'}</RippleButton>}
      </ContentProducts>
    </div>
  )
}

ListProducts.propTypes = {
  OPEN_MODAL_ORGANICE: PropTypes.shape({
    setState: PropTypes.func,
    state: PropTypes.any
  }),
  data: PropTypes.shape({
    length: PropTypes.number,
    map: PropTypes.func
  }),
  dataFree: PropTypes.shape({
    length: PropTypes.any
  }),
  fetchMore: PropTypes.func,
  filter: PropTypes.any,
  handleChangeFilter: PropTypes.any,
  handleDelete: PropTypes.func,
  loading: PropTypes.any,
  onClickClear: PropTypes.func,
  organice: PropTypes.any,
  pState: PropTypes.number,
  search: PropTypes.any,
  setShowMore: PropTypes.func,
  showMore: PropTypes.any
}
