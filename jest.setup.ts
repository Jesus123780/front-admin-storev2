// jest.setup.ts

import '@testing-library/jest-dom';

import { TextEncoder, TextDecoder } from 'util';

// Fix for JSDOM environment
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;
