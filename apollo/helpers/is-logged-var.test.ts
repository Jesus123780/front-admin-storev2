import { isLoggedVar } from './is-logged-var'

describe('isLoggedVar', () => {
    it('should have the correct initial value', () => {
        expect(isLoggedVar()).toEqual({
            state: true,
            expired: false,
            message: '',
            code: ''
        })
    })

    it('should update the value correctly', () => {
        isLoggedVar({
            state: false,
            expired: true,
            message: 'Session expired',
            code: 401
        })

        expect(isLoggedVar()).toEqual({
            state: false,
            expired: true,
            message: 'Session expired',
            code: 401
        })
    })

    it('should allow partial updates if merged manually', () => {
        // Simulate a partial update by merging with the current value
        isLoggedVar({
            ...isLoggedVar(),
            message: 'Logged out',
            code: 'LOGOUT'
        })

        expect(isLoggedVar()).toEqual({
            state: false,
            expired: true,
            message: 'Logged out',
            code: 'LOGOUT'
        })
    })
})