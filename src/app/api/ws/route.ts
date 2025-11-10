import { startDevWSServer } from './lib/ws-server';

export async function GET() {
  try {
    const { port } = await startDevWSServer();
    return Response.json({ active: true, port });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return Response.json({ active: false, port: null, error: message });
  }
}
