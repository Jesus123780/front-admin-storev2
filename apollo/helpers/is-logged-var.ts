import { makeVar } from '@apollo/client'

interface IsLoggedVar {
    state: boolean
    expired: boolean
    message: string
    code: string | number
}

export const isLoggedVar = makeVar<IsLoggedVar>({ state: true, expired: false, message: '', code: '' })
