import Link from 'next/link'
import styled, { css } from 'styled-components'
import {
  BGColor,
  DarkSilver,
  EColor,
  PColor,
  SECColor
} from 'pkg-components'

export const Content = styled.div`
  width: 100%;
  height: 100vh;
  display: grid;
  overflow: hidden;
  grid-template-columns: repeat(auto-fill, minmax(50%, 1fr));
  @media only screen and (max-width: 960px) {
    width: 100%;
    margin: auto;
    flex: wrap;
    width: 100%;
    margin: auto;
    display: flex;
    flex-direction: column-reverse;
    justify-content: center;
    align-items: center;
  }
  .container-step {
    margin: auto;

  }
  .container-step__header {
    @media only screen and (max-width: 960px) {
      display: none;
     }
  }
`
export const Form = styled.form`
  align-self: center;
  background-color: var(--color-base-white);
  border-radius: 8px;
  box-shadow: var(--box-shadow-sm);
  height: 600px;
  overflow-y: auto;
  padding: 36px;
  place-content: center;
  position: relative;
  width: 600px;
  margin-top: 20px;
    @media only screen and (max-width: 960px) {
        height: 100%;
        width: 90%;
        max-height: 80vh;
        margin: 20px;
        overflow-y: auto;
    }
`
export const WrapDirection = styled.div`
  align-self: center;
  background-color: var(--color-base-white);
  border-radius: 8px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  overflow: hidden;
  position: relative;
  transition: all 0.5s ease;
  @media screen and (max-width: 960px) {
    box-shadow: none;
  }
  ${(props) => {
    return props.showLocation
      ? css`
          padding: 0;
          height: auto;
          padding: 0;
        `
      : css`
          height: 0;
        `
  }};
`
export const ContainerSliderForm = styled.form`
  @media (min-width: 960) {
    position: absolute;
    width: 100%;
    top: 0;
    padding: 36px 50px;
    margin: auto;
    height: 100%;
    background-color: ${BGColor};
    left: 0;
    transform: ${(props) => {
    return props.activeLogin ? 'translateX(0px)' : 'translateX(900px)'
  }};
    transition: all 0.6s ease;
  }
`
export const Iconos = styled.div`
  color: ${({ color }) => {
    return color ? color : EColor
  }};
  margin: ${({ margin }) => {
    return margin ? margin : '0px 7px'
  }};
  ${({ size }) => {
    return (
      size &&
      css`
        font-size: ${size};
      `
    )
  }}
`
export const ButtonSubmit = styled.button`
  background-color: ${({ color, theme }) => {
    return color === '1'
      ? ' #4065b4'
      : color === '2'
        ? `${BGColor}`
        : theme.SFAColor
  }};
  outline: none;
  border: none;
  box-shadow: var(--box-shadow-md);
  font-family: PFont-Regular;
  cursor: pointer;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: ${({ content }) => {
    return content ? content : 'space-between'
  }};
  font-size: ${({ size }) => {
    return size ? size : '1rem'
  }};
  color: ${({ colorFont }) => {
    return colorFont ? colorFont : `${BGColor}`
  }};
  line-height: 1.5;
  border-radius: 0.3rem;
  text-align: center;
  width: 100%;
  margin: 10px 7px;
  ${(props) => {
    return (
      props.hoverColor &&
      css`
        &:hover {
          color: ${BGColor};
          background-color: ${PColor};
        }
      `
    )
  }};
  ${(props) => {
    return (
      props.colorPrimary &&
      css`
         {
          color: ${BGColor};
          background-color: ${PColor};
        }
      `
    )
  }};
`
export const Enlace = styled(Link)`
  position: absolute;
  transform: translateX(0);
  left: 44px;
  display: block;
`
export const Card = styled.div`
  font-size: 16px;
  position: relative;
  justify-content: center;
  display: flex;
  width: 70%;
  height: 100vh;
  @media only screen and (max-width: 960px) {
      &::before {
        content: "";
        min-width: 130vh;
        min-height: 135vh;
        width: 130vw;
        height: 130vw;
        z-index: -1;
        position: absolute;
        background-color: #fdedee;
        border-radius: 0 100% 100%;
        left: 50%;
        bottom: 0;
      }
    }
    @media only screen and (min-width: 960px) {
      &::before {
        right: 0;
        bottom: unset;
        left: auto;
        min-width: 130vh;
        min-height: 135vh;
        max-width: 80vw;
        max-height: 80vw;
        width: 80vw;
        height: 80vw;
        -webkit-transform: translate(15vw, -23%);
        transform: translate(15vw, -23%);
      }
  }
  &:before {
    content: "";
    min-width: 130vh;
    min-height: 135vh;
    width: 130vw;
    height: 130vw;
    z-index: -1;
    position: absolute;
    background-color: #fdedee;
    border-radius: 0 100% 100%;
    left: 50%;
    transform: translate(-70%);
    bottom: -70px;
  }
`

export const ContentCardInfo = styled.div`
  display: grid;
  gap: 24px;
  margin: 0px auto;
  max-width: 767px;
  padding: 56px 24px;
`
export const ContentCards = styled.div`
  font-size: 16px;
  gap: 16px;
  margin: 0px auto;
  max-width: 767px;
  padding: 56px 24px;
`

export const Cards = styled.div`
  border-radius: 6px;
  border: 1px solid rgb(242, 242, 242);
  transform: scale(1);
  transition: transform 250ms ease-in 0s;
  max-width: 500px;
  &:hover {
    transform: scale(1.015);
    transition: transform 250ms ease-in 0s;
  }
`
export const Card2 = styled(Cards)`
  max-width: 100%;
  border-radius: 6px;
  padding: 16px;
  background-color: rgb(255, 255, 255);
  border-width: 1px;
  border-style: solid;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-color: rgb(242, 242, 242);
`
export const GoBack = styled.div`
  display: flex;
  margin-bottom: 40px;
  & > span {
    font-family: PFont-Light;
    font-size: 14px;          
    text-align: center;
    color: ${({ theme }) => {
    return `${theme.PColor}`
  }};
  }
`
export const Text = styled.h2`
  @media only screen and (min-width: 960px) {
    margin: 0 0 42px;
    text-align: ${({ align }) => {
    return align ? align : 'start'
  }};
    margin: ${({ margin }) => {
    return margin ? margin : '0'
  }};
    font-size: ${({ size }) => {
    return size ? size : '1.5rem'
  }};
  }
  font-weight: initial;
  font-family: PFont-Regular;
  color: ${({ color }) => {
    return color ? color : DarkSilver
  }};
  margin: 0 0 22px;
  ${(props) => {
    return (
      props.cursor &&
      css`
        cursor: pointer;
      `
    )
  }}
`

// cards
export const Line = styled.div`
  height: 0.125rem;
  background-color: #393a3d;
  border-radius: 0.0625rem;
  margin: 0 0 10px 0;
`
export const ContentPrice = styled.div`
  font-weight: bold;
  position: relative;
  & #number {
    position: absolute;
    top: 1.0625rem;
    right: 64px;
  }
  & #letters {
    position: absolute;
    top: 2.1rem;
    right: 43px;
  }
`
export const BtnItem = styled.button`
  outline: none;
  border: none;
  background: none !important;
  font-family: PFont-Light;
  padding: 0 !important;
  color: inherit;
  line-height: inherit;
  padding-left: 0.5rem;
  padding-right: 0.625rem;
  position: relative;
  text-align: left;
  position: relative;
  font-size: 14px;
  &:hover {
    text-decoration: underline;
    cursor: pointer;
  }
  ${(props) => {
    return (
      props.overflow &&
      css`
        margin-top: 0;
        margin-bottom: 0.5rem;
        font-weight: 500;
        line-height: 1.2;
        font-size: 1.25rem;
        width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      `
    )
  }}
`
export const FeatureItem = styled.div`
  display: flex;
  align-items: flex-start;
  padding-top: 0.5rem;
  cursor: default;
  width: fit-content;
  /* flex-direction: column; */
  padding-top: 0.5rem;
`
export const Pricing = styled.span`
  position: relative;
  color: #6b6c72;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.5;
  width: 100%;
  font-family: PFont-Light;
  margin-bottom: 1.25rem;
  position: relative;
`
export const ContentToggle = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
`
export const ButtonTheme = styled.div`
  width: 65px;
  min-width: 65px;
  cursor: pointer;
  height: 30px;
  background-color: ${SECColor};
  border-radius: 30px;
  position: relative;
  transition: 0.3s ease;
`
export const SwitchButton = styled.button`
  width: 23px;
  height: 23px;
  border-radius: 50%;
  top: 3px;
  position: absolute;
  ${({ active }) => {
    return (
      active &&
      css`
        left: ${active};
      `
    )
  }}
  transition: .3s ease;
`
export const ContentCarPrice = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  /* height: 70vh; */
  @media (max-width: 900px) {
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    justify-content: center;
  }
`
export const ContentPricing = styled.div`
  max-width: 73.75rem;
  margin: 0 auto;
  padding: 1.25rem;
  position: relative;
`
export const BtnClose = styled.button`
  position: absolute;
  cursor: pointer;
  top: 0.75rem;
  right: 1.25rem;
  display: flex;
  height: 2rem;
  width: 2rem;
  padding: 0;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  outline: none;
  color: #8d9096;
  z-index: 1305;
`
export const CardWrap = styled.div`
  display: ${({ display }) => {
    return display || 'flex'
  }};
  /* flex-direction: ${({ flexDirection }) => {
    return flexDirection || 'row'
  }}; */
  justify-content: ${({ justify }) => {
    return justify || 'space-between'
  }};
  flex-wrap: ${({ wrap }) => {
    return wrap || 'wrap'
  }};
  margin: ${({ margin }) => {
    return margin || '30px 0px 0px 0px'
  }};
  border: ${({ border }) => {
    return border || 'none'
  }};
  padding: ${({ padding }) => {
    return padding || '0'
  }};
  background-color: ${({ bgColor }) => {
    return bgColor || BGColor
  }};
  min-width: ${({ minWidth }) => {
    return minWidth || 'auto'
  }};
  max-width: ${({ maxWidth }) => {
    return maxWidth || 'auto'
  }};
  min-height: ${({ minHeight }) => {
    return minHeight || 'auto'
  }};
  height: ${({ height }) => {
    return height || 'auto'
  }};
  ${({ shadow }) => {
    return (
      shadow &&
      css`
        box-shadow: ${shadow};
      `
    )
  }}
  ${({ overflow }) => {
    return (
      overflow &&
      css`
        overflow: ${overflow};
      `
    )
  }}
    ${({ radius }) => {
    return (
      radius &&
      css`
        border-radius: ${radius};
      `
    )
  }}
    ${({ alignContent }) => {
    return (
      alignContent &&
      css`
        align-content: ${alignContent};
      `
    )
  }}
    /* flex-flow: column; */
    width:${({ width }) => {
    return width || 'auto'
  }};
  ${({ media }) => {
    return (
      media &&
      css`
        @media (max-width: 900px) {
          width: 47%;
        }
      `
    )
  }}
  ${({ mediax }) => {
    return (
      mediax &&
      css`
        @media (max-width: 900px) {
          width: 33%;
          min-width: 192px;
        }
      `
    )
  }}
`
export const Module = styled.div`
  padding: 2.375rem 0.625rem 0 2.5rem;
  & ul {
    padding: 0 0 0 1.25rem !important;
    margin: 0;
    list-style-type: disc;
  }
  & li {
    font-size: 0.9rem;
    line-height: 1.5;
    margin: 0.75rem 0;
    font-family: PFont-Light;
  }
`
export const ModuleInfo = styled.div`
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  background: ${BGColor};
  z-index: 1300;
  height: 25rem;
  cursor: pointer;
  transition: all 200ms ease-in-out;
  ${({ show }) => {
    return show
      ? css`
          opacity: 1;
        `
      : css`
          visibility: hidden;
          margin: 0;
          opacity: 0;
          transform: translateY(-11px);
        `
  }}
`
