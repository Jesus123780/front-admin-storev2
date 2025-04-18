import styled from 'styled-components'

export const ContentAddonsGrid = styled.div`
    display: grid;
    grid-gap: 19px 50px;
    grid-template-columns: repeat( auto-fit,minmax(250px,1fr) );
    margin: 40px 0;
    padding: 0 75px;
    background-color: var(--color-base-white);
    width: 100%;
`