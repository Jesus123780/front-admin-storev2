const { spawn } = require('node:child_process');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const URL = `http://${HOST}:${PORT}`;

const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';

const npmCommand = isWindows ? 'npx.cmd' : 'npx';

const server = spawn(
  npmCommand,
  ['next', 'dev', '-p', String(PORT)],
  {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  },
);

let browserOpened = false;
let shuttingDown = false;

function openBrowser() {
  if (browserOpened || shuttingDown) return;

  browserOpened = true;

  let command;
  let args;

  if (isMacOS) {
    command = 'open';
    args = [URL];
  } else if (isWindows) {
    command = 'rundll32.exe';
    args = ['url.dll,FileProtocolHandler', URL];
  } else {
    command = 'xdg-open';
    args = [URL];
  }

  const browser = spawn(command, args, {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
    shell: false,
  });

  browser.once('error', (error) => {
    console.error(
      '\nNo se pudo abrir el navegador automáticamente:',
      error.message,
    );

    console.log(`Abre esta dirección manualmente: ${URL}\n`);
  });

  browser.once('spawn', () => {
    console.log(`\nNavegador abierto: ${URL}\n`);
    browser.unref();
  });
}

const waitOn = spawn(
  npmCommand,
  [
    'wait-on',
    `tcp:${HOST}:${PORT}`,
    '--timeout',
    '120000',
  ],
  {
    stdio: 'inherit',
    env: process.env,
    shell: false,
  },
);

waitOn.once('close', (code) => {
  if (code === 0 && server.exitCode === null && !shuttingDown) {
    openBrowser();
    return;
  }

  if (code !== 0 && !shuttingDown) {
    console.error(
      '\nNo fue posible detectar Next.js en el puerto',
      PORT,
    );
  }
});

function shutdown() {
  if (shuttingDown) return;

  shuttingDown = true;

  if (waitOn.exitCode === null) {
    waitOn.kill();
  }

  if (server.exitCode === null) {
    server.kill('SIGTERM');
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.once('error', (error) => {
  console.error('\nError al iniciar Next.js:', error.message);
  shutdown();
  process.exitCode = 1;
});

server.once('close', (code) => {
  if (waitOn.exitCode === null) {
    waitOn.kill();
  }

  process.exitCode = code ?? 0;
});