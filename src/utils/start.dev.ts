/**
 * Starts the Next.js server and automatically opens it in the user's default browser.
 * @returns {Promise<number>} The port where Next.js is running.
 */
import { getPort } from 'get-port-please'
import next from 'next'

export const startNextJSServer = async (): Promise<number> => {
  const port = await getPort({ portRange: [30011, 50000] });

  // Create Next.js server instance
  const nextApp = next({
    dev: true,
    customServer: true,
    hostname: 'localhost',
    port,
  });

  const handleRequest = nextApp.getRequestHandler();

  await nextApp.prepare();

  // Create an HTTP server
  const http = await import('node:http');
  const server = http.createServer((req, res) => handleRequest(req, res));

  await new Promise<void>((resolve, reject) => {
    server.listen(port, (err?: Error) => {
      if (err) { reject(err); }
      else { resolve(); }
    });
  });

  return port;
};

(async () => {
  const port = await startNextJSServer();
  const url = `http://localhost:${port}/login`;
  import('node:child_process').then(({ exec }) => exec(`start ${url}`));
})()