// lib/dev-ws-server.ts
// backend/ws-server.ts
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { getPort } from 'get-port-please'
import { WebSocketServer } from 'ws';

const getServerPortWss = async () => {
  const basePath = path.join(os.homedir(), 'app_data')
  const port = await getPort({ portRange: [40000, 50000] })
  const portFile = path.join(basePath, 'port.txt')

  await fs.promises.mkdir(basePath, { recursive: true })
  await fs.promises.writeFile(portFile, port.toString())
  return port
}

let wss: WebSocketServer | null = null;
let port: number | null = null;

export async function startDevWSServer() {
  if (wss) {return { wss, port };} // evitar levantar dos veces
  port = await getServerPortWss()
  wss = new WebSocketServer({ port });

  wss.on('connection', ws => {
    ws.send(JSON.stringify({ active: true }));
  });

  return { wss, port };
}
