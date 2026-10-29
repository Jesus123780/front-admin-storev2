import {
    fireEvent,
    render,
    screen,
    waitFor
} from '@testing-library/react'
import { fetchJson } from 'npm-pkg-hook'
import React from 'react'

import { Login } from './index'

// Mocks
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('npm-pkg-hook', () => ({
    Cookies: {
        get: jest.fn(),
    },
    encryptSession: jest.fn((data) => `encrypted:${data}`),
    fetchJson: jest.fn(),
    isTokenExpired: jest.fn(),
    signOutAuth: jest.fn(() => Promise.resolve()),
    useLoading: () => ({
        loading: false,
        wrap: <T extends (...args: object[]) => unknown>(fn: T) => fn(),
        start: jest.fn(),
        stop: jest.fn(),
    }),
    useLogout: () => ({
        onClickLogout: jest.fn(),
    }),
    useRegisterDeviceUser: () => [jest.fn()],
    useSetSession: () => [jest.fn()],
}))

jest.mock('../../../apollo/getDeviceId', () => ({
    getDeviceId: jest.fn(() => Promise.resolve('device-123')),
}))

jest.mock('../../utils', () => ({
    decodeToken: jest.fn(() => ({
        name: 'Test User',
        email: 'test@gmail.com',
        sub: 'subid',
        picture: 'https://example.com/picture.jpg',
    })),
    getUserFromToken: jest.fn(() => Promise.resolve({ message: '' })),
}))

jest.mock('./styles.module.css', () => ({
    container: 'container',
    card: 'card',
    form_login: 'form_login',
    btn_close: 'btn_close',
}))

const mockSetAlertBox = jest.fn()
const mockSendNotification = jest.fn()

import { AppContextState, Context } from '../../context/Context'

const defaultContext: AppContextState = {
    setAlertBox: mockSetAlertBox,
    isElectron: false,
    sendNotification: mockSendNotification,
    authData: null,
    collapsed: false,
    countPedido: 0,
    error: null,
    googleLoaded: false,
    loading: false,
    menu: [],
    notification: null,
    setAuthData: jest.fn(),
    setCollapsed: jest.fn(),
    setCountPedido: jest.fn(),
    setError: jest.fn(),
    setGoogleLoaded: jest.fn(),
    setLoading: jest.fn(),
    setMenu: jest.fn(),
    setNotification: jest.fn(),
    setUser: jest.fn(),
    user: null,
}

const renderLogin = (contextOverrides = {}, props = {}) => {
    return render(
        <Context.Provider
            value={{
                ...defaultContext,
                ...contextOverrides,
            }}
        >
            <Login {...props} />
        </Context.Provider>
    )
}

describe('Login', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // 🔒 Mock seguro de globalThis.location para evitar crash de jsdom
        if (Object.getOwnPropertyDescriptor(globalThis, 'location')?.configurable) {
            Object.defineProperty(globalThis, 'location', {
                writable: true,
                value: {
                    origin: 'http://localhost',
                    href: 'http://localhost/',
                    assign: jest.fn(),
                    replace: jest.fn(),
                },
            })
        }

        process.env.NEXT_PUBLIC_URL_BACK_SERVER = 'http://localhost'
        process.env.NEXT_PUBLIC_SESSION_NAME = 'session_name'
        process.env.NEXT_PUBLIC_CLIENT_ID_LOGIN_GOOGLE = 'client_id_123'
    })

    it('renders GoogleLogin when not electron', () => {
        renderLogin({ isElectron: false })

        expect(screen.getByText('Continuar con Google')).toBeInTheDocument()
    })
})
