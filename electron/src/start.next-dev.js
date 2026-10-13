const { spawn } = require('node:child_process');
const open = require('open');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const URL = `http://${HOST}:${PORT}`;

const server = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['next', 'dev', '-p', String(PORT)],
  {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  },
);

let browserOpened = false;

async function openBrowser() {
  if (browserOpened) return;

  browserOpened = true;

  try {
    await open(URL);
    console.log(`\nNavegador abierto: ${URL}\n`);
  } catch (error) {
    console.error('No se pudo abrir el navegador:', error.message);
  }
}

const waitOn = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['wait-on', `tcp:${HOST}:${PORT}`, '--timeout', '120000'],
  {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  },
);

waitOn.on('close', async (code) => {
  if (code === 0 && server.exitCode === null) {
    await openBrowser();
  }
});

function shutdown() {
  waitOn.kill();

  if (server.exitCode === null) {
    server.kill('SIGTERM');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.on('error', (error) => {
  console.error('Error al iniciar Next.js:', error.message);
  process.exitCode = 1;
});

server.on('close', (code) => {
  waitOn.kill();
  process.exitCode = code ?? 0;
});