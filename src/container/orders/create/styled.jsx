import {
  APColor,
  BGColor,
  DarkSilver,
  SECBGColor,
  SFVColor
} from 'pkg-components'
import styled, { css } from 'styled-components'

export const Input = styled.input`
    outline: none;
    padding: 12px;
    width: 100%;
    margin-bottom: 20px;
`
export const ContentCalcules = styled.div`
    position: fixed;
    right: 0;
    width: max-content;
    bottom: -1px;
    display: flex;
    border-radius: 4px;
    justify-content: space-between;
    h2 {
        color: var(--color-text-gray-light);
        font-family: PFont-Light;
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.25rem;
    }
`
export const ScrollbarProduct = styled.div`
    overflow: hidden auto;
    background-color:  ${BGColor};
    border-left: 1px solid #e9ecef;
    z-index: 9999;
    margin: ${({ margin }) => { return margin || '0' }};
    h2 {
        color: var(--color-text-gray-light);
        display: flex;
        display: inline;
        font-family: PFont-Light;
        font-size: 1.9em;
        font-weight: 400;
        justify-content: center;
        margin: 0 0 2px;
        text-align: center;
        text-rendering: optimizeLegibility;
    }
`
export const FlipTop = styled.div`
    position: relative;
    width: max-content;
`
export const Warper = styled.div`
    background-color:  ${BGColor};
    border-bottom: 1px solid #e9ecef;
    display: flex;
    flex-wrap: wrap;
    padding: 10px;
    position: sticky;
    top: 0;
    z-index: 9999;

    .ripple-button  {
        height: min-content;
        margin-top: 15px !important;
        padding: 13px !important;
    }
`
export const CtnSwiper = styled.div`
    background-color: ${BGColor};
    box-shadow: inset 0 -1px 0 #dcdcdc;
    height: min-content;
    margin: 0 0 20px 0;
`
export const Box = styled.div`
    display: ${({ display }) => { return display }};
    place-content: center;
    place-items: center;
    position: relative;
    width: ${({ width }) => { return width || '100%' }};
`
export const Wrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    .input-textarea {
        height: 200px;
        min-height: 100%;
        outline: none;
        width: 100%;
    }
    .parent {
        max-width: 100%;
        overflow: hidden;
        width: 100%;
    }
    .child {
    border-radius: 3px;
    height: 100%;
}
`
export const ContainerGrid = styled.div`
    display: grid;
    height: 100vh;
    margin: 0;
    position: relative;
    margin: auto;
    padding-bottom: 20px;
    padding: 0 30px;
    grid-template-columns: repeat(auto-fill,minmax(275px,1fr));
    grid-gap: 30px;


    @media only screen and (min-width: 960) and (min-width: 960px) {
        grid-template-columns: repeat(auto-fill,minmax(175px,1fr));
    }
    @media only screen and (min-width: 960) {
        grid-auto-rows: max-content;
        grid-gap: 100px 20px;
        grid-template-columns: repeat(auto-fill,minmax(172px,1fr));
    }
`
export const CateItem = styled.div`
    background-color: ${SECBGColor};
    border-radius: 200px;
    color: ${DarkSilver};
    cursor: pointer;
    display: flex;
    overflow: hidden;
    padding: 0 5px;
    place-content: center;
    place-items: center;

    .name-categorie {
        font-family: 'PFont-Light';
        overflow: hidden;
        white-space: nowrap;
    }
    .icon {
        max-height: 20%;
        max-width: 20%;
        min-height: 20%;
        min-width: 20%;
    }
`
export const SliderCategoryProducts = styled.div`
    display: flex;
`
export const Text = styled.span`
    font-weight: ${({ fontWeight }) => { return fontWeight || '700' }};
`
export const Item = styled.div`
    border-top: 1px solid ${SFVColor};
    display: ${({ display }) => { return display || 'grid' }};
    grid-template-columns: 25% repeat(auto-fill, 25%);
    padding: 15px;
    place-content: space-between;
    place-items: center;
    span {
        display: inline-block;
    }
`
export const Content = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`
export const ContainerTicket = styled.div`
        position: relative;
    .wrapper-action__footer {
        background: var(--color-neutral-white);
        border-radius: 60px;
        display: flex;
        justify-content: space-between;
        margin: 0 0 0 auto;
        position: sticky;
        right: 0;
        top: 30px;
        width: min-content;
        z-index: 9999;
        & > button {
            transition: all 0.3s ease;
            &:hover {
                box-shadow: 0 8px 20px rgba(0,0,0,0.3);
                transform: translateY(-3px);
            }

        }
    }
`
export const Ticket = styled.div`
    background-color:#ecebeb;
    position: absolute;
    top: 0;
    
.ticket {
    background-color: var(--color-neutral-white);
    font-family: PFont-Regular;
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 300px;
    margin: 0 30px;
    position: relative;
    transform: scale(0.8);
    width: 120mm;
}

.ticket-info_client_restaurant {
    padding: 15px;
    display: flex;
    flex-direction: column;
}

.divider {
    background-image: radial-gradient(circle at 0 50%,transparent 30px,#FFF 0,#fff 80%,transparent 0),radial-gradient(circle at 100% 50%,#ecebeb 30px,#fff 0,#ecebeb 80%,#ecebeb 0);
    display: flex;
    height: 100px;
    position: relative;
    & > div {
        position: absolute;
        border-top: 2px dashed #f2f2f2;
        width: 87%;
        top: 0;
        bottom: 0;
        margin: auto;
        height: 1px;
        left: 30px;
    }
}
.wrapper__arrow_button {
    height: 40px;
}

.wrapper__sub-items {
    display: flex;
}
    .sub-items {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
}
.sub-item__values {
    width: 50%;
    
    .item--values {
      display: flex;
      justify-content: space-between;
      padding: 15px;
    }
}

.arrow_button {
    position: relative;
    width: 20px;
    margin: 0;
  }

  .arrow_button::after {
    content: "";
    position: absolute;
    bottom: -18px;
    left: 50%;
    margin-left: -10px;
    border-width: 10px;
    border-style: solid;
    border-color: #FFFFFF transparent transparent transparent;
  }
.ticket h5 {
  font-size: 24px;
  margin-bottom: 0.5rem;
}

.ticket p {
  margin: 0;
}

.ticket-image {
  margin-top: 1rem;
  text-align: center;
}

.ticket-image img {
  width: 100%;
  max-width: 400px;
  height: auto;
  object-fit: cover;
}

.ticket-title {
  text-align: center;
  font-weight: bold;
  font-size: 28px;
  margin: 1rem 0;
}

.ticket-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.ticket-item .title {
  font-weight: bold;
}

.ticket-item:last-of-type {
  margin-top: 1rem;
  border-top: 1px solid black;
  padding-top: 0.5rem;
}

.ticket-item-total {
  font-size: 20px;
}

.ticket-item-total .title {
  font-size: 20px;
}

`
export const Button = styled.button`
    background-color: transparent;
    outline: none;
    &:disabled{
        background-color: blue;
    }
    cursor: pointer;
    color: ${({ color }) => { return color || BGColor }};
    border: 1px solid transparent;
    border-radius: 10px;

    ${({ active }) => {
    return active ? css`
        border: 1px solid ${APColor};
    ` : css`
    border: 1px solid #CCCCCC69;
    `}}
`
