/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.spec.json',
      },
    ],
  },
  coverageDirectory: '../coverage',
  collectCoverageFrom: [
    '**/*.service.ts',
    '!**/main.ts',
  ],
  coverageThreshold: {
    global: { lines: 70, functions: 70, branches: 60 },
  },
  testEnvironment: 'node',
};
