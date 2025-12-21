import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Dashboard from './Dashboard';
import { productsAPI, vendorsAPI, transactionsAPI, forecastingAPI } from '../services/api';

// Mock the API module
jest.mock('../services/api');

describe('Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    // Setup mock to return pending promises
    productsAPI.getAll.mockReturnValue(new Promise(() => {}));
    vendorsAPI.getAll.mockReturnValue(new Promise(() => {}));
    transactionsAPI.getAll.mockReturnValue(new Promise(() => {}));
    forecastingAPI.getAll.mockReturnValue(new Promise(() => {}));

    render(<Dashboard />);
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  test('displays dashboard title after loading', async () => {
    productsAPI.getAll.mockResolvedValue({ data: [] });
    vendorsAPI.getAll.mockResolvedValue({ data: [] });
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    forecastingAPI.getAll.mockResolvedValue({ data: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('📊 POS System Dashboard')).toBeInTheDocument();
    });
  });

  test('displays correct stats when data is loaded', async () => {
    productsAPI.getAll.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
    vendorsAPI.getAll.mockResolvedValue({ data: [{ id: 1 }] });
    transactionsAPI.getAll.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] });
    forecastingAPI.getAll.mockResolvedValue({ data: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Products count
      expect(screen.getByText('1')).toBeInTheDocument(); // Vendors count
      expect(screen.getByText('3')).toBeInTheDocument(); // Transactions count
    });
  });

  test('displays stat cards with correct labels', async () => {
    productsAPI.getAll.mockResolvedValue({ data: [] });
    vendorsAPI.getAll.mockResolvedValue({ data: [] });
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    forecastingAPI.getAll.mockResolvedValue({ data: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('📦 Products')).toBeInTheDocument();
      expect(screen.getByText('🏢 Vendors')).toBeInTheDocument();
      expect(screen.getByText('💰 Transactions')).toBeInTheDocument();
      expect(screen.getByText('📈 Forecasts')).toBeInTheDocument();
    });
  });

  test('displays welcome section', async () => {
    productsAPI.getAll.mockResolvedValue({ data: [] });
    vendorsAPI.getAll.mockResolvedValue({ data: [] });
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    forecastingAPI.getAll.mockResolvedValue({ data: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Welcome to Intelligent POS System')).toBeInTheDocument();
      expect(screen.getByText('Manage your multi-vendor sales and forecasting platform')).toBeInTheDocument();
    });
  });

  test('displays error message when API fails', async () => {
    productsAPI.getAll.mockRejectedValue(new Error('Network Error'));
    vendorsAPI.getAll.mockRejectedValue(new Error('Network Error'));
    transactionsAPI.getAll.mockRejectedValue(new Error('Network Error'));
    forecastingAPI.getAll.mockRejectedValue(new Error('Network Error'));

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    });
  });

  test('calls all API endpoints on mount', async () => {
    productsAPI.getAll.mockResolvedValue({ data: [] });
    vendorsAPI.getAll.mockResolvedValue({ data: [] });
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    forecastingAPI.getAll.mockResolvedValue({ data: [] });

    render(<Dashboard />);

    await waitFor(() => {
      expect(productsAPI.getAll).toHaveBeenCalled();
      expect(vendorsAPI.getAll).toHaveBeenCalled();
      expect(transactionsAPI.getAll).toHaveBeenCalled();
      expect(forecastingAPI.getAll).toHaveBeenCalled();
    });
  });
});
