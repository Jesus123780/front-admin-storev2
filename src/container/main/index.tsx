'use client'

import PropTypes from 'prop-types'
import { Column } from 'pkg-components'
import { ChatStatistic } from '../ChatStatistic'

interface User {
  email?: string;
}

export const Main = ({ user = {} as User }) => {
  return (
    <Column>
      <ChatStatistic />
    </Column>
  )
}

Main.propTypes = {
  user: PropTypes.object
}
