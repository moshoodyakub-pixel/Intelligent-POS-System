// Minimal manual mock for react-router-dom used by Jest tests.
// Keep this small and stable — it prevents "Cannot find module 'react-router-dom'"
// when tests import routing symbols.
const React = require('react');

const mockUseNavigate = () => {
  const fn = () => {};
  fn.mockName = 'mockUseNavigate';
  return fn;
};

module.exports = {
  __esModule: true,
  // Basic components that render children transparently
  BrowserRouter: ({ children }) => React.createElement(React.Fragment, null, children),
  MemoryRouter: ({ children }) => React.createElement(React.Fragment, null, children),
  // Links as anchors
  Link: ({ children, to, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
  NavLink: ({ children, to, ...rest }) => React.createElement('a', { href: to, ...rest }, children),
  // Hooks
  useNavigate: () => mockUseNavigate(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
  // Simple pass-throughs for Routes/Route
  Routes: ({ children }) => React.createElement(React.Fragment, null, children),
  Route: ({ element }) => element || null
};
