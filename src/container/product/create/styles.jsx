import { PColor } from 'pkg-components'
import styled, { css } from 'styled-components'

export const Steps = styled.div`
  border-bottom: 0.5px solid #e9ecef;
  display: flex;
  margin-bottom: 30px;
  padding: 5px;
  position: relative;
`

export const ActionStep = styled.div`
  align-content: space-between;
  align-items: center;
  background-color: #fff;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  left: 0;
  position: sticky;
`

export const Tabs = styled.div`
  position: relative;
    ${({ active }) => {
    return active
      ? css`
                color: ${PColor};
                font-weight: 600;
                &::before {
                    content: '';
                    background: ${PColor};
                    bottom: -7px;
                    height: 2px;
                    left: 0;
                    position: absolute;
                    width: 100%;
                }
                `
      : css`
                color: #9e9e9e;
                font-weight: 200;
                `
  }}
`