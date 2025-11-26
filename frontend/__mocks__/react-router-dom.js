import React from 'react';

// Mock the components to simply render their children
export const BrowserRouter = ({ children }) => <>{children}</>;
export const Routes = ({ children }) => <>{children}</>;
export const Route = ({ children }) => <>{children}</>;
export const Link = ({ children, to }) => <a href={to}>{children}</a>;

// Mock the hooks for v6
export const useNavigate = () => jest.fn();
export const useLocation = () => ({ pathname: '/' });
export const useParams = () => ({});
