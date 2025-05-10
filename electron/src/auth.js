// auth.js
const { BrowserWindow } = require('electron')
const { OAuth2Client } = require('google-auth-library')
const { OAUTH_CLIENT } = require('./secrets')

const CLIENT_ID = '780573025907-lkt9o371s3d2i6lqr3jpa1ou0qmb0jkh.apps.googleusercontent.com'
const REDIRECT_URI = 'http://localhost:3000/api/auth'



const initOAuthClient = () => {
    return new OAuth2Client({
        clientId: CLIENT_ID,
        clientSecret: OAUTH_CLIENT.client_secret,
        redirectUri: REDIRECT_URI
    })
}

const getOAuthCodeByInteraction = (interactionWindow, authPageURL) => {
    // Open navigarion window  browser window whit shell

    const shell = require('electron').shell
    shell.openExternal(authPageURL)


    // return new Promise((resolve, reject) => {
    //     const onClosed = () => {
    //         console.log('Interaction window closed by user')
    //         reject('User closed the window')
    //     }

    //     interactionWindow.on('closed', onClosed)

    //     interactionWindow.webContents.on('did-navigate', (event, urlStr) => {
    //         const url = new URL(urlStr)
    //         if (url.origin === 'http://localhost:3000') {
    //             const code = url.searchParams.get('code')
    //             const error = url.searchParams.get('error')

    //             interactionWindow.removeListener('closed', onClosed)
    //             interactionWindow.close()

    //             if (error) {
    //                 reject(error)
    //             } else {
    //                 resolve(code)
    //             }
    //         }
         
    //     })
    // })
}

const startGoogleAuth = async (mainWindow, port) => {
    const client = initOAuthClient(port)
    const url = client.generateAuthUrl({
        scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email'],
    })

    const authWindow = new BrowserWindow({
        width: 500,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    })

    try {
        const code = await getOAuthCodeByInteraction(authWindow, url)
        console.log("🚀 ~ startGoogleAuth ~ code:", code)
        const { tokens } = await client.getToken(code)

        if (tokens) {
            mainWindow.webContents.send('auth-success', tokens)
        } else {
            mainWindow.webContents.send('auth-error', 'No tokens received')
        }
    } catch (error) {
        mainWindow.webContents.send('auth-error', error.toString())
    }
}

module.exports = { startGoogleAuth }
