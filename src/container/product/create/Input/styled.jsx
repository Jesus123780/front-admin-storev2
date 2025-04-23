import styled, { css } from 'styled-components'
import { BGColor } from '../../../../public/colors'

export const LabelInput = styled.span`
    background-color: ${ BGColor };
    color:  #CCC;
    font-family: PFont-Light;
    font-size: ${ ({ value }) => {return value ? value : '16px'} };
    left: ${ ({ left }) => {return left ? left : '17px'} };
    left: 15px;;
    pointer-events: none;
    position: absolute;
    text-align: left;
    top: ${ ({ value }) => {return value ? '5px' : '10px'} };
    transition: .2s;
    user-select: none;
`
export const Input = styled.input`
    border-radius: 5px;
    border: 1px solid var(--color-neutral-gray-silver);
    font-family: PFont-Light;
    font-size: 15px;
    font-weight: 500;
    margin: 10px 0;
    outline: 0;
    padding: 20px 10px;
    width: 100%;
    &:focus ~ ${ LabelInput } {
        color: #CCC;
        font-size: 16px;
        padding: 0px 5px ;
    }
    &:disabled{
        color: #808080;
    }
`
export const TextAreaInput = styled.textarea`
    padding: 20px 10px;
    margin: 10px 0;
    outline: 0;
    border: 1px solid var(--color-neutral-gray-silver);
    font-weight: 500;
    font-size: 15px;
    width: 100%;
    border-radius: 5px;
    font-family: PFont-Light;
    &:focus ~ ${ LabelInput } {
        font-size: 16px;
        color: #CCC;
        padding: 0px 5px ;
    }
    &:disabled{
        color: #808080;
    }
`
export const BoxInput = styled.div`
    position: relative;
    padding: ${ ({ padding }) => {return padding ? padding : '10px 0px'} };
    width: ${ ({ width }) => {return width ? width : '100%'} };
 ${props => {
    return props.error && css`
        .alert_error {
            position: absolute;
            bottom: -10px;
            left: 14px;
            font-size: 13px;
            color: #ff0000;
        }
    `}
}
`