import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Forecasting from './Forecasting';
import { forecastingAPI, productsAPI } from '../services/api';
import { mockProducts, mockForecasts } from '../testUtils';

// Mock the API module
jest.mock('../services/api');

describe('Forecasting Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    forecastingAPI.getAll.mockReturnValue(new Promise(() => {}));
    productsAPI.getAll.mockReturnValue(new Promise(() => {}));

    render(<Forecasting />);
    expect(screen.getByText('Loading forecasts...')).toBeInTheDocument();
  });

  test('displays forecasting page title after loading', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: mockForecasts, pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts } });

    render(<Forecasting />);

    await waitFor(() => {
      expect(screen.getByText('📈 Sales Forecasting')).toBeInTheDocument();
    });
  });

  test('shows new forecast button', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: [] } });

    render(<Forecasting />);

    await waitFor(() => {
      expect(screen.getByText('➕ Manual Forecast')).toBeInTheDocument();
    });
  });

  test('opens form when New Forecast button is clicked', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts } });

    render(<Forecasting />);

    await waitFor(() => {
      expect(screen.getByText('➕ Manual Forecast')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ Manual Forecast'));

    await waitFor(() => {
      expect(screen.getByText('➕ Create Manual Forecast')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Forecasted Quantity')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Forecasted Price')).toBeInTheDocument();
    });
  });

  test('closes form when button is clicked again', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts } });

    render(<Forecasting />);

    await waitFor(() => {
      expect(screen.getByText('➕ Manual Forecast')).toBeInTheDocument();
    });

    // Open form
    fireEvent.click(screen.getByText('➕ Manual Forecast'));
    await waitFor(() => {
      expect(screen.getByText('➕ Create Manual Forecast')).toBeInTheDocument();
    });

    // Close form - when form is open, button shows "✕ Close"
    fireEvent.click(screen.getByText('✕ Close'));
    await waitFor(() => {
      expect(screen.queryByText('➕ Create Manual Forecast')).not.toBeInTheDocument();
    });
  });

  test('displays forecast cards when data exists', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: mockForecasts, pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts } });

    render(<Forecasting />);

    await waitFor(() => {
      expect(screen.getByText('📦 Product A')).toBeInTheDocument();
      expect(screen.getByText('📦 Product B')).toBeInTheDocument();
    });
  });

  test('displays forecasted quantity and price', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: mockForecasts, pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts } });

    render(<Forecasting />);

    await waitFor(() => {
      expect(screen.getByText(/150 units/)).toBeInTheDocument();
      expect(screen.getByText(/\$89.99/)).toBeInTheDocument();
    });
  });

  test('displays delete button for each forecast', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: mockForecasts, pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts } });

    render(<Forecasting />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('🗑️ Delete');
      expect(deleteButtons).toHaveLength(2);
    });
  });

  test('displays error message when API fails', async () => {
    forecastingAPI.getAll.mockRejectedValue(new Error('Network Error'));
    productsAPI.getAll.mockRejectedValue(new Error('Network Error'));

    render(<Forecasting />);

    await waitFor(() => {
      // Component shows error in both notification and error div
      const errorElements = screen.getAllByText('Failed to load forecasts');
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  test('calls API endpoints on mount', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: [] } });

    render(<Forecasting />);

    await waitFor(() => {
      expect(forecastingAPI.getAll).toHaveBeenCalled();
      expect(productsAPI.getAll).toHaveBeenCalled();
    });
  });

  test('displays product dropdown in form', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts } });

    render(<Forecasting />);

    await waitFor(() => {
      expect(screen.getByText('➕ Manual Forecast')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ Manual Forecast'));

    await waitFor(() => {
      expect(screen.getByText('Select Product')).toBeInTheDocument();
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });
  });

  test('form has create forecast button', async () => {
    forecastingAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts } });

    render(<Forecasting />);

    await waitFor(() => {
      expect(screen.getByText('➕ Manual Forecast')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ Manual Forecast'));

    await waitFor(() => {
      expect(screen.getByText('✅ Create Forecast')).toBeInTheDocument();
    });
  });
});
