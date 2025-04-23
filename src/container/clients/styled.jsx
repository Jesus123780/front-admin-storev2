'use client'


import { PColor } from 'pkg-components'
import styled from 'styled-components'

export const Container = styled.div`


`
export const Item = styled.div``
export const Button = styled.button`
    color: ${PColor};
    text-decoration: underline;
    background-color: transparent;
    cursor: pointer;
`
export const GridStatistics = styled.div`
    border-radius: 5px;
    display: grid;
    grid-template-columns: repeat( auto-fit, minmax(250px, 1fr) );
    padding: 30px;
    place-content: center;
    h2 {
        font-size: 1.3em;
        margin-bottom: 10px;
        text-align: center;
    }
    p {
        text-align: center;
    }
`