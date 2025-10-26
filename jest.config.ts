import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'jsdom',

  testMatch: [
    '<rootDir>/src/**/*.(test|spec).ts',
    '<rootDir>/src/**/*.(test|spec).tsx'
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss|sass)$': 'identity-obj-proxy',
    '^pkg-components(.*)$': '<rootDir>/__mocks__/pkg-components-mock.js',
     '^npm-pkg-hook(.*)$': '<rootDir>/__mocks__/npm-pkg-hook-mock.js'
  },

  transformIgnorePatterns: [
    '/node_modules/'
  ],

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },

  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  clearMocks: true,
  verbose: true,
};

export default config;
