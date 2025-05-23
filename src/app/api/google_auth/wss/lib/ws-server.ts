// lib/ws-server.ts
import { createServer, IncomingMessage } from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import os from 'os'
import fs from 'fs'
import { getPort } from 'get-port-please';

export const getServerPortWss = async () => {
    const basePath = path.join(os.homedir(), 'app_data')
    const createPort = getPort({
        portRange: [40000, 50000]
    })
    // save the port to a file
    const port = await createPort;
    const portFilePath = path.join(basePath, 'port.txt');
    await fs.promises.mkdir(basePath, { recursive: true });
    await fs.promises.writeFile(portFilePath, port.toString(), 'utf-8');

    try {
        const port = await fs.promises.readFile(portFilePath, 'utf-8')
        return parseInt(port, 10)
    } catch (error) {
        console.error('Error reading port file:', error)
        return await createPort
    }
  

}

export async function getWSServer() {
  const PORT_WSS = await getServerPortWss()
  const server = createServer();
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req: IncomingMessage, socket, head: Buffer) => {
    if (!!req.headers['BadAuth']) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    ws.on('message', (msg, isBinary) => {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg, { binary: isBinary });
        }
      });
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
  });

  server.listen(PORT_WSS, () => {
    console.log(`🟢 WSS running at ws://localhost:${PORT_WSS}`);
  });

  return {
    wss,
    server,
    url: `ws://localhost:${PORT_WSS}`,
  };
}
