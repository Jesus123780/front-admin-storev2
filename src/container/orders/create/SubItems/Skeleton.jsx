import React from 'react'
import { Skeleton as SkeletonComponent } from 'pkg-components'


export const Skeleton = ({ numberObject = 16, style }) => {
  return (
    <div style={style || { margin: '10px', padding: '20px 20px 20px 0', width: '96%' }}>
      <SkeletonComponent
        height={30}
        margin='10px'
        numberObject={numberObject}
      />
    </div>
  )
}
