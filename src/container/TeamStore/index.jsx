'use client'

import { useColorByLetters,useEmployee } from 'npm-pkg-hook'
import { ProfileCard, Skeleton } from 'pkg-components'
import styled, { css } from 'styled-components'

export const TeamStore = () => {
  const [data] = useEmployee()
  const { getCustomColors } = useColorByLetters()

  return (
    <ContainerTeam>
      {!data?.length &&
        <Skeleton
          className='loading'
          height='69'
          margin='5px 0'
          numberObject={4}
          width='100%'
        />
      }
      {data?.length ? data?.map(x => {
        const { color, bgColor, borderColor } = getCustomColors(x?.user?.name)
        const displayText = String(x?.user?.name).substring(0, 2).toUpperCase()
        const props = {
          ...x,
          color,
          bgColor,
          borderColor,
          displayText
        }
        return (

          <ProfileCard {...props} key={x.eId} />
        )
      }) : <></>}
    </ContainerTeam>
  )
}

export const ContainerTeam = styled.div`
  .loading {
    margin-top: 10px;
  }
  .team__item {
    align-items: center;
    border-radius: 5px;
    border: 0;
    border: 1px solid var(--color-neutral-gray-silver);
    display: flex;
    min-height: 69px;
    padding: 0.9375rem 1.25rem;
    position: relative;
    text-align: left;
    width: 100%;

  }
`
export const ItemInf = styled.div`
  padding: .75rem;
  ${props => {
    return props.end && css`
  justify-content: flex-end;
    display: flex;

  `}}
`