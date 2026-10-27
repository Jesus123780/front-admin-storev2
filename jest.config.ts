import { Config } from 'jest';
import path from 'path'

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
    '^swiper/css.*$': 'identity-obj-proxy',

    // 👇 assets
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',

    // 👇 FORZAR UNA SOLA COPIA DE REACT (incluyendo jsx-runtime y jsx-dev-runtime)
    '^react$': path.resolve(__dirname, 'node_modules/react'),
    '^react/jsx-runtime$': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    '^react/jsx-dev-runtime$': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
    '^react-dom$': path.resolve(__dirname, 'node_modules/react-dom'),
    '^react-dom/(.*)$': path.resolve(__dirname, 'node_modules/react-dom/$1'),

    // 👇 MOCKS de swiper
    '^swiper$': '<rootDir>/__mocks__/swiper/swiper.js',
    '^swiper/react$': '<rootDir>/__mocks__/swiper/react.js',
    '^swiper/modules$': '<rootDir>/__mocks__/swiper/modules.js',

    // 👇 MOCK de gridstack
    '^gridstack$': '<rootDir>/__mocks__/gridstack.js',

    '^npm-pkg-hook(.*)$': '<rootDir>/__mocks__/npm-pkg-hook-mock.js',
  },

  transformIgnorePatterns: [
    '/node_modules/(?!(pkg-components)/)',
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
