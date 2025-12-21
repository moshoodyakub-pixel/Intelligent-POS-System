import { render, screen } from '@testing-library/react';
import Login from './components/Login';
import Register from './components/Register';
import { BrowserRouter } from 'react-router-dom';

// Mock axios with proper axios.create implementation
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  
  return {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn().mockResolvedValue({ data: [] }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  };
});

// Mock AuthContext
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    loading: false,
    error: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: () => false,
    isAdmin: () => false,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Authentication Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('Login page renders with form fields', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  test('Register page renders with form fields', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('heading', { name: /Create Account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Choose a username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });
});
