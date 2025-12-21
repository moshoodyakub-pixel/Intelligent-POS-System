module.exports = {
  // root for this package
  roots: ['<rootDir>'],
  testEnvironment: 'jsdom',
  // Ensure the real transform pipeline is used for .js/.jsx/.ts/.tsx
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest'
  },
  // If you have other ESM deps you need to transpile, add them to this whitelist
  transformIgnorePatterns: ['/node_modules/(?!(react-router-dom)/)'],
  // Map react-router-dom to the local mock so module resolution never fails
  moduleNameMapper: {
    '^react-router-dom$': '<rootDir>/__mocks__/react-router-dom.js',
    '^@sentry/react$': '<rootDir>/__mocks__/@sentry/react.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  // CRA uses setupTests; keep compatibility
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  // Helpful Jest defaults
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node']
};
