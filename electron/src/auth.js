// auth.js
const { OAuth2Client } = require('google-auth-library')
const { OAUTH_CLIENT } = require('./secrets')
const { shell } = require('electron')
const { startOAuthCallbackServer } = require('./startOAuthCallbackServer')

const CLIENT_ID = '780573025907-lkt9o371s3d2i6lqr3jpa1ou0qmb0jkh.apps.googleusercontent.com'
const PORT_REDIRECT = 5173
export const REDIRECT_URI = 'http://localhost:5173/oauth/callback'

const initOAuthClient = () => {
    return new OAuth2Client({
        clientId: CLIENT_ID,
        clientSecret: OAUTH_CLIENT.client_secret,
        redirectUri: REDIRECT_URI
    })
}

const getOAuthCodeByInteraction = async (authPageURL, port, mainWindow) => {
    shell.openExternal(authPageURL)
    mainWindow.webContents.send('auth-started', 'Authentication started. Please check your browser.')
    await startOAuthCallbackServer(port, mainWindow)
}

export const startGoogleAuth = async (mainWindow, port) => {
    try {
        const client = initOAuthClient()
        const url = client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
            ],
        })

        await getOAuthCodeByInteraction(url, PORT_REDIRECT, mainWindow)

    } catch (error) {
        mainWindow.webContents.send('auth-error', error.toString())
    }
}
