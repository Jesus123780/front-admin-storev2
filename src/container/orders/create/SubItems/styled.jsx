import styled from 'styled-components'

export const Content = styled.div`
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
`
export const Container = styled.div`
    overflow-y: auto;
    line-height: 1.15;
    font-size: 16px;
    overflow-y: auto;
    height: 100%;
    padding: 16px 0px;

`
export const DishAction = styled.div`
    align-items: center;
    background: #fff;
    border-top: 2px solid #f5f0eb;
    display: flex;
    justify-content: flex-end;
    padding: 20px;
    height: 80px;
    width: 100%;
    && button {
    background-color: transparent;
    }
`