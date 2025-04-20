import { BColor, BGColor, PColor } from 'pkg-components'
import styled, { keyframes } from 'styled-components'

export const Container = styled.div`
    width: 100%;
    margin: 0 auto;
`
export const CardPedido = styled.div`
    background-color: ${BGColor};
    border-radius: 5px;
    border: 1px solid #838388;
    box-shadow: 1px 1px 11px 0px #cccccc29;
    display: flex;
    justify-content: space-between;
    margin: 0.5em  0;
    padding: 0.5em;
    .button-show-more {
        background-color: transparent;
        color: ${PColor};

    }
`
export const Text = styled.span`
    box-sizing: border-box;
    color: var(--color-text-gray-light);
    color: ${BColor};
    cursor: pointer;
    font-size: ${({ size }) => {return size || '1.125rem'}};
    font-weight: 400;
    line-height: 1.5rem;
    margin-top: 0;
    overflow: hidden;
    text-overflow: ellipsis;
`

export const CicleStatus = styled.span`
    -webkit-box-align: stretch;
    -webkit-box-pack: center;
    align-items: stretch;
    background-color: ${({ color }) => {return color || '' }};
    border-radius: 50%;
    border: none;
    box-shadow: 0 0 0 2px var(--ds-surface-overlay,#FFFFFF);
    box-sizing: content-box;
    cursor: inherit;
    display: flex;
    flex-direction: column;
    font-family: inherit;
    font-size: inherit;
    height: 32px;
    justify-content: center;
    margin: 2px;
    outline: none;
    overflow: hidden;
    padding: 0px;
    position: static;
    transform: translateZ(0px);
    transition: transform 200ms ease 0s, opacity 200ms ease 0s;
    width: 32px;
`


const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: .75;
  }
  25% {
    transform: scale(1);
    opacity: .75;
  }
  100% {
    transform: scale(2.5);
    opacity: 0;
  }
`


export const ContainerDrag = styled.div`

`
export const Bubble = styled.div`
  display: block;
  position: relative;
  margin: 20px 0;
  max-width: 100px;
  width: 100px;
  min-width: 100px;
  &:hover:after {
    background-color:  ${({ color }) => {return color || '' }};
  }

  &:after {
    content: "";
    background-color:  ${({ color }) => {return color || '' }};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    position: absolute;
    display: block;
    top: 1px;
    left: 1px;
  }

  .bubble-outer-dot {
    margin: 1px;
    display: block;
    text-align: center;
    opacity: 1;
    background-color:  ${({ color }) => {return color || '' }};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    animation: ${pulse} 1.5s linear infinite;
  }

  .bubble-inner-dot {
    display: block;
    text-align: center;
    opacity: 1;
    background-color:  ${({ color }) => {return color || '' }};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    animation: ${pulse} 1.5s linear infinite;
  }

  .bubble-inner-dot:after {
    content: "";
    display: block;
    text-align: center;
    opacity: 1;
    background-color:  ${({ color }) => {return color || '' }};
    width: 12px;
    height: 12px;
    border-radius: 50%;
    animation: ${pulse} 1.5s linear infinite;
  }
`
