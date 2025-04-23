import styled from 'styled-components'
import {
  BColor,
  BGColor,
  NorthTexasGreen,
  PColor
} from 'pkg-components'

export const Div = styled.div`
    width: 30%;
`
export const ContainerListOptions = styled.div`
    display: flex;
    flex-wrap: wrap;
    display: flex;
    padding: 40px 0;
    margin: 102px 0;
    .wrapper-list {
        width: 30%;
        margin: 0 10px;
    }
`
export const WrapperList = styled.div`
    width: 100%;
    cursor: move;
`
export const GarnishChoicesHeader = styled.div`
    padding: 12px 20px 10px;
    display: flex;
    place-content: center;
    align-items: center;
    justify-content: space-between;
    background: #f2f2f2;
    position: sticky;
    top: 0px;
    border-bottom: 1px solid #ccc;
    z-index: 99;
    margin-bottom: 80px;
    top: -11px;
    .content {
        display: flex;
        user-select: none;
    }
    .garnish-choices__title { 
        margin: 0;
        font-size: 1rem;
        line-height: 1.25em;
        font-weight: 500;
        color: #3f3e3e;
        overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    }
    .garnish-choices__title-desc {
        font-weight: 100;
        font-size: .875rem;
        line-height: 17px;
        display: block;
        color: #717171;
    }
     .marmita-minitag{
        -webkit-text-size-adjust: 100%;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    --screen-x: 1495px;
    --screen-y: 937px;
    font-family: SulSans,Helvetica,sans-serif;
    box-sizing: border-box;
    display: inline-block;
    background: #fff;
    border-radius: 3px;
    margin: 0 3px 0 0;
    height: 20px;
    text-transform: uppercase;
    font-weight: 500;
    font-feature-settings: "tnum";
    font-variant-numeric: tabular-nums;
    font-size: .5625rem;
    line-height: 1;
    background-color: #717171;
    color: #f5f0eb;
    border: none;
    padding: 6px 6px 4px;
     }
     .garnish-choices {
        justify-content: flex-end;
        display: flex;
        align-items: center;
     }
`
export const CardsComponent = styled.div`
    background-color: ${BGColor};
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    .title_card {
        word-break: break-word;
        font-family: PFont-Light;
        color: ${BColor};
        margin: 10px 0 0 0;
        font-size: 1rem;
        line-height: 1.25em;
        font-weight: 500;
    }
    .price-value {
        word-break: break-word;
        font-family: PFont-Light;
        color: ${PColor};
        margin: 10px 0 0 0;
        font-size: 1rem;
        line-height: 1.25em;
        font-weight: 600;
    }
    .price-free {
        margin: 10px 0 0 0;
        margin: 10px 0 0 0;
        color: ${NorthTexasGreen};
    }
    .price-neto {
        color: #717171;
        font-size: var(--font-size-base);
        left: 5px;
        margin: 10px 0 0 0;
        position: absolute;
        right: 0;
        top: -21px;
    }
`
export const ContentModal = styled.form`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        .header {
            position: static;
            width: auto;
            justify-content: flex-end;
            padding: 20px 6px 0;
            min-height: auto;
            height: auto;
            display: flex;
        }
        .content {
            line-height: 1.15;
    font-size: 16px;
    overflow-y: auto;
    height: 100%;
    padding: 16px 20px;

        }
`
export const BodyDnd = styled.div`
    .first-column {
        display: grid;
        grid-template-columns: 25% repeat(auto-fill,25%) 25%;
        width: 100%;
        grid-gap: 19px 5px;
        overflow: auto;
        height: 100%;
    }
`
export const ContentLinesItems = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: min-content;
    border-bottom: 1px solid #ccc;
    ${props => { return props.noBorder && `border-bottom: none` }}
`
export const ContentCheckbox = styled.div`
    transition: all .1s;
    color: inherit;
    cursor: pointer;
    outline: none;
    position: relative;
    margin-right: 2px;
`

export const Container = styled.div`
    padding: 20px;
    overflow: auto;
    @media only screen and (max-width: 960) {
        display: none;
        padding: 0;
    }
`
export const Action = styled.div`
    align-items: center;
    background: #fff;
    border-top: 2px solid #f5f0eb;
    display: flex;
    justify-content: space-between;
    padding: 20px;
    height: 80px;
    width: 100%;
`

