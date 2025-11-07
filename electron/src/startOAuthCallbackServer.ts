import { Server } from 'node:http'
import { URL } from 'node:url'

import express from 'express'

export const startOAuthCallbackServer = (
    port: number,
    mainWindow: Electron.BrowserWindow
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const app = express()
        let server: Server

        interface GoogleAuthResponse {
            access_token: string
            refresh_token?: string
            expires_in?: number
            token_type?: string
            id_token?: string
            [key: string]: any
        }

        interface CustomRequest extends express.Request {
            query: {
                code?: string
                [key: string]: any
            }
            url: string
        }

        app.get('/oauth/callback', async (req: CustomRequest, res: express.Response): Promise<void> => {
            let responseSent = false
            try {
                console.log(`[AUTH] OAuth callback received: ${req.url}`)
                const code: string = req.query.code as string
                const currentURL = new URL(mainWindow.webContents.getURL())
                const baseURL = `${currentURL.protocol}//${currentURL.hostname}:${currentURL.port}`
                const getUserInfo: string = `${baseURL}/api/google_auth`

                const data = fetch(`${getUserInfo}?code=${encodeURIComponent(code)}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                })
                    .then((response: Response) => response.json())
                    .then((data: GoogleAuthResponse) => {
                        mainWindow.webContents.send('google-auth-success', data)
                        res.send(`
                    <html>
                    <body>
                    <h3>Authenticated… you can close this window.</h3>
                    </body>
                    </html>
                `)
                        responseSent = true
                        return data
                    })
                    .catch((error: unknown) => {
                        console.error('Error fetching user info:', error)
                        mainWindow.webContents.send('google-auth-error', error)
                        if (!responseSent) {
                            res.status(500).send('Internal Server Error')
                        }
                    })

                resolve(data)
                setTimeout(() => server?.close(), 2000)
            } catch (error: unknown) {
                console.error('Error in OAuth callback:', error)
                // Handle the error and send a response to the client
                mainWindow.webContents.send('google-auth-error', error)
                // You can customize the response based on your needs
                if (!responseSent) {
                    res.status(500).send('Internal Server Error')
                }
                reject(error)
            }
        })


        server = app.listen(port, () => {
            console.log(`[AUTH] OAuth callback server listening at http://localhost:${port}/api/auth`)
        })

        server.on('error', (err) => reject(err))
    })
}
