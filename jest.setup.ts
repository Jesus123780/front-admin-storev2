// jest.setup.ts

import '@testing-library/jest-dom';

import { TextDecoder,TextEncoder } from 'util';

// Fix for JSDOM environment
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;

// Variables de entorno usadas por componentes que las leen a nivel de módulo
// (p. ej. BACKEND_URL en el contenedor Login). Deben existir antes de importar
// esos módulos, por eso se definen aquí (setupFilesAfterEnv corre antes de los
// imports de cada suite).
process.env.NEXT_PUBLIC_URL_BACK_SERVER =
    process.env.NEXT_PUBLIC_URL_BACK_SERVER || 'http://localhost';
process.env.NEXT_PUBLIC_SESSION_NAME =
    process.env.NEXT_PUBLIC_SESSION_NAME || 'session_name';
process.env.NEXT_PUBLIC_CLIENT_ID_LOGIN_GOOGLE =
    process.env.NEXT_PUBLIC_CLIENT_ID_LOGIN_GOOGLE || 'client_id_123';
