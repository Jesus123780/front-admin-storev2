'use client'

import { useColorByLetters,useEmployee } from 'npm-pkg-hook'
import { ProfileCard, Skeleton } from 'pkg-components'

export const TeamStore = () => {
  const [data] = useEmployee()
  const { getCustomColors } = useColorByLetters()

  return (
    <div>
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
    </div>
  )
}
