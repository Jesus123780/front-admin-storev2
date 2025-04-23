import { PColor } from 'pkg-components'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Button = styled.button`
  align-items: center;
  background-color: #FFFFFF;
  border: 1px solid #DBDBDB;
  color: #262626;
  cursor: pointer;
  display: flex;
  font-size: 14px;
  height: 50px;
  justify-content: space-between;
  line-height: 20px;
  margin: 0 15px;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${PColor};
  }

  &:hover {
    background-color: #FAFAFA;
  }

  &:active {
    background-color: #F4F4F4;
  }

  .icon {
    fill: currentColor;
    height: 24px;
    margin-left: 8px;
    width: 24px;
  }
`

export function QuickFiltersButton({ onClick = () => { return } }) {
  // Remove this
  const isFalse = false
  return (
    <>
      {isFalse ? <Button onClick={onClick}>
        <span>Filtros rápidos</span>
        <span className='icon'>
          <svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
            <path
              d='M8.292 10.293a1.009 1.009 0 000 1.419l2.939 2.965c.218.215.5.322.779.322s.556-.107.769-.322l2.93-2.955a1.01 1.01 0 000-1.419.987.987 0 00-1.406 0l-2.298 2.317-2.307-2.327a.99.99 0 00-1.406 0z'
              fill='currentColor'
              fillRule='evenodd'
            />
          </svg>
        </span>
      </Button> : <></>}
    </>
  )
}

QuickFiltersButton.propTypes = {
  onClick: PropTypes.func
}
