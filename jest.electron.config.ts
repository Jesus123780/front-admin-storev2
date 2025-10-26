import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',

  rootDir: './electron',

  testMatch: [
    '<rootDir>/**/*.(test|spec).ts'
  ],

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { useESM: true }
    ],
  },

  extensionsToTreatAsEsm: ['.ts'],
  clearMocks: true
};

export default config;
