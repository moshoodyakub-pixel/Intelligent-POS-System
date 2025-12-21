// Mock for @sentry/react
const mockSentry = {
  init: jest.fn(),
  ErrorBoundary: ({ children }) => children,
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  browserTracingIntegration: jest.fn(() => ({})),
  replayIntegration: jest.fn(() => ({})),
  withScope: jest.fn((callback) => callback({ setTag: jest.fn(), setExtra: jest.fn() })),
};

module.exports = mockSentry;
