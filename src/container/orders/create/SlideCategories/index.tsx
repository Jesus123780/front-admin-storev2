import { Checkbox } from 'pkg-components'
import PropTypes from 'prop-types'
import React from 'react'
import {
  A11y,
  Navigation,
  Pagination,
  Parallax,
  Virtual
} from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'

export const MemoSwiperSliderCategory = ({
  datCat = [],
  checkedItems,
  disabledItems = new Set(),
  handleChangeCheck = () => { return }
}) => {
  if (datCat && datCat?.length === 0) {return <div></div>}

  return (
    <div>
      <div>
        <Swiper
          breakpoints={{
            // Cuando el ancho de la pantalla sea menor o igual a 767px
            767: {
              slidesPerView: 1,
              spaceBetween: 5
            },
            // Cuando el ancho de la pantalla sea mayor que 767px y menor o igual a 991px
            991: {
              slidesPerView: 2,
              spaceBetween: 10
            },
            // Cuando el ancho de la pantalla sea mayor que 991px y menor o igual a 1199px
            1199: {
              slidesPerView: 3,
              spaceBetween: 15
            }
          }}
          modules={[Virtual, Navigation, Pagination, A11y, Parallax]}
          navigation
          slidesPerView={4}
          spaceBetween={15}
          style={{ padding:10 }}
          virtual
        >
          {datCat?.map((slideContent, index) => {
            const isLastChild = index === datCat.length - 1 // Verifica si es el último hijo
            return (
              <SwiperSlide
                key={slideContent.carProId} 
                style={{ marginRight: isLastChild ? '20px' : '0' }}
                virtualIndex={index}
              >
                <div style={{ marginRight: isLastChild ? '20px' : '0' }} >
                  <Checkbox
                    checked={checkedItems.has(slideContent.carProId)}
                    disabled={disabledItems.has(slideContent.carProId)}
                    id={slideContent.carProId}
                    label={slideContent?.pName}
                    onChange={handleChangeCheck}
                  />
                </div>
              </SwiperSlide>
            )
          })}
        </Swiper>
      </div>
    </div>
  )
}

MemoSwiperSliderCategory.propTypes = {
  checkedItems: PropTypes.shape({
    has: PropTypes.func
  }),
  datCat: PropTypes.array,
  disabledItems: PropTypes.shape({
    has: PropTypes.func
  }),
  handleChangeCheck: PropTypes.func
}
export const SwiperSliderCategory = React.memo(MemoSwiperSliderCategory)