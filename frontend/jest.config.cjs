module.exports = {
  // root for this package
  roots: ['<rootDir>'],
  testEnvironment: 'jsdom',
  // Ensure the real transform pipeline is used for .js/.jsx/.ts/.tsx
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest'
  },
  // Transpile react-router-dom and other ESM dependencies via babel-jest
  transformIgnorePatterns: ['/node_modules/(?!(react-router-dom|react-router|@remix-run)/)'],
  // Use real react-router-dom with babel-jest transform (no mock mapping needed)
  moduleNameMapper: {
    '^@sentry/react$': '<rootDir>/__mocks__/@sentry/react.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  // CRA uses setupTests; keep compatibility
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  // Helpful Jest defaults
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node']
};
