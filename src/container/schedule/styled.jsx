import {
  BGColor,
  GraniteGray,
  PVColor,
  TFSColor
} from 'pkg-components'
import styled, { css } from 'styled-components'

export const Bar = styled.div`
  background-color: #e0f2df;
  border-radius: 5px;
  margin-top: 5px;
`


export const Text = styled.h3`
  color: ${TFSColor};
  font-family:  PFont-Light;
  font-size: ${({ size }) => { return size || '13px' }};
  font-weight: 400;
`
export const Select = styled.select`
  background-color: ${BGColor};
  border-radius: 4px;
  border: 1px solid ${GraniteGray};
  color: ${GraniteGray};
  font-size: 1rem;
  height: 48px;
  padding: 13px 20px;
  width: 100%;
`
export const CardSelectLabel = styled.label`
    margin: 20px 0px 12px 0px;
    font-size: 15px;
`
export const Form = styled.form`
    height: 95%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`
export const ScheduleHeader = styled.div`
    border-bottom: 1px solid  ${`${GraniteGray}69`};;
    border-left: 1px solid  ${`${GraniteGray}69`};;
    display: flex;
    height: ${({ isChart }) => { return isChart ? 'auto' : '10%' }};;
    justify-content: space-between;
    margin:  ${({ isChart }) => { return isChart ? '' : '0 0 0 auto' }};
    padding: 0;
    gap: 5px 10px;
    width: ${({ isChart }) => { return isChart ? 'auto' : '80%' }};
    display: ${({ isChart }) => { return isChart ? 'grid' : 'flex' }};
    grid-template-columns: ${({ isChart }) => { return isChart ? 'repeat( auto-fit,minmax(150px,1fr) )' : '' }};

`
export const CardSelect = styled.select`
    background-color: ${({ theme }) => { return theme.BGAColor }};
    border: 1px solid ${({ theme }) => { return theme.PLVColor }};
    font-size: 16px;
    padding: 7px 17px;
    width: 200px;
`
export const ModalSelect = styled(CardSelect)`
    height: 36px;
    margin: 0px 20px 0px 0px;
`
export const ScheduleHeaderNav = styled.button`
  background-color: ${({ current }) => {return (current ? PVColor : 'transparent')}};
  border-radius: 20px;
  border: 1px solid ${TFSColor};
  color: ${({ current }) => {return (current ? BGColor : TFSColor)}};
  cursor: pointer;
  font-size: 11px;
  margin: 5px;
  padding: 0;
  width: 95%;
  height: 30px;
  text-align: center;
  @media only screen and (min-width: 960) {
    font-size: 10px;
    padding: 0;
    width: 95%;
    margin: 5px 5px;
    height: 30px;
  }

`
export const AModalRow = styled.div`
    padding: 10px;
`
export const AModalBtnDelete = styled.div`
    display:flex;
    justify-content: center;
    align-items: center;
    height: 38px;
    margin-top: 50px;
    width: 68px;
    background-color: ${({ theme }) => { return theme.EColor }};
    color: ${({ theme }) => { return theme.BGAColor }};
    ${({ hide }) => { return hide === 0 && css`display:none;` }};
    border-radius: 5px;
    :hover{
        cursor:pointer;
    }
    @media only screen and (max-width: 860px){
        width:100%;
        margin-top: 30px;
    }
`
export const CardSelectOption = styled.option`
  :checked {
    background-color:${({ theme }) => { return theme.PLVColor }}
  }
`
export const CardSelectC = styled.div`
    display:flex;
    flex-direction: column;
`

export const ModalSelectC = styled(CardSelectC)`
    justify-content: flex-end;
    min-width: 200px;
    ${({ hide }) => { return hide === 0 && css`display:none;` }}
    @media only screen and (max-width: 860px){
        width:100%;
    }
`

export const Card = styled.div`
  display: ${({ display }) => { return display || 'flex' }};
  flex-wrap: ${({ wrap }) => { return wrap || 'wrap' }};
  height: ${({ height }) => { return height || 'min-content' }};
  width: ${({ width }) => { return width || 'auto' }};
  justify-content: ${({ justify }) => { return justify || 'initial' }};
  padding: ${({ padding }) => { return padding || '1%' }};
  position: relative;
  ${({ radius }) => { return radius && css`border-radius: ${radius};` }}
  ${({ overflow }) => { return overflow && css`overflow: ${overflow};` }}
  transition: .5s ease;  
  margin: ${({ margin }) => { return margin || '0' }};
  background-color: ${({ bgColor }) => { return bgColor || '#e0f2df' }};
  ${props => { return props.active ? css`border: 3px solid ${PVColor};` : css`border: 3px solid transparent;` }}
  box-shadow: 0px 0px 14px #00000017;
  flex-direction: ${({ direction }) => { return direction || 'row' }};
  &:hover {
    cursor: pointer;
    box-shadow: rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px;
  }

  ${props => {
    return props.animation && css`
    &:hover {
      transform: scale(1.2); 
      z-index: 9999;
    }  
  `}}
`

export const ListSchedulesContainer = styled.div`
    position: relative;
    overflow: auto;
    height: calc(100% - 10%);
    display: flex;
    flex-wrap: wrap;
    overflow-x: hidden;
`

export const LeftLine = styled.div`
  border-left: 1px solid ${`${GraniteGray}69`};
  position: absolute;
  left: 20%;
  width: auto;
  height: 100%;
  top: 0;

`
export const HourItem = styled.div`
  height: 60px;
  margin-bottom: 10px;
  text-align: right;
  position: relative;
`

export const HorizontalLine = styled.div`
border-bottom: 1px solid #ccc;
  position: absolute;
  top: ${({ top }) => {return top * 40}}px; /* Ajustamos el valor del top con la misma lógica que las tarjetas */
  width: 100%;
  transform: translateY(-50%);
`

export const ScheduleContent = styled.div`
  width: 80%;
  position: absolute;
  left: 20.35%;
`

export const TimeLines = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
`

export const Line = styled.div`
  position: absolute;
  width: 100%;
  height: 1px;
  margin: 30px 0
  ${({ top }) => {return css`
    top: ${top * 40}px;
  `}}
`

export const ContainLine = styled(Line)`
  position: absolute;
  width: 100%;
  background-color: #ccc;
  ${({ top }) => {return css`
    top: ${top * 40}px;
  `}}
`