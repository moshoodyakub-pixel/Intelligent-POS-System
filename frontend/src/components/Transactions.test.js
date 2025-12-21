import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Transactions from './Transactions';
import { transactionsAPI, productsAPI, vendorsAPI } from '../services/api';
import { mockVendors, mockProducts, mockTransactions } from '../testUtils';

// Mock the API module
jest.mock('../services/api');

// Mock react-table using shared utility
jest.mock('react-table', () => ({
  useTable: (...args) => require('../testUtils').mockUseTable(...args),
}));

// Mock react-modal using shared utility
jest.mock('react-modal', () => require('../testUtils').createModalMock());

describe('Transactions Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    transactionsAPI.getAll.mockReturnValue(new Promise(() => {}));
    productsAPI.getAll.mockReturnValue(new Promise(() => {}));
    vendorsAPI.getAll.mockReturnValue(new Promise(() => {}));

    render(<Transactions />);
    expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
  });

  test('displays transactions page title after loading', async () => {
    transactionsAPI.getAll.mockResolvedValue({ data: mockTransactions });
    productsAPI.getAll.mockResolvedValue({ data: mockProducts });
    vendorsAPI.getAll.mockResolvedValue({ data: mockVendors });

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText('💰 Transactions')).toBeInTheDocument();
    });
  });

  test('shows new transaction button', async () => {
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    productsAPI.getAll.mockResolvedValue({ data: [] });
    vendorsAPI.getAll.mockResolvedValue({ data: [] });

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText('➕ New Transaction')).toBeInTheDocument();
    });
  });

  test('opens modal when New Transaction button is clicked', async () => {
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    productsAPI.getAll.mockResolvedValue({ data: mockProducts });
    vendorsAPI.getAll.mockResolvedValue({ data: mockVendors });

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText('➕ New Transaction')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ New Transaction'));

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Create New Transaction')).toBeInTheDocument();
    });
  });

  test('displays transaction form fields in modal', async () => {
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    productsAPI.getAll.mockResolvedValue({ data: mockProducts });
    vendorsAPI.getAll.mockResolvedValue({ data: mockVendors });

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText('➕ New Transaction')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ New Transaction'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Quantity')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Total Price')).toBeInTheDocument();
    });
  });

  test('displays dropdown for vendors in modal', async () => {
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    productsAPI.getAll.mockResolvedValue({ data: mockProducts });
    vendorsAPI.getAll.mockResolvedValue({ data: mockVendors });

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText('➕ New Transaction')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ New Transaction'));

    await waitFor(() => {
      expect(screen.getByText('Select Vendor')).toBeInTheDocument();
      expect(screen.getByText('Vendor A')).toBeInTheDocument();
      expect(screen.getByText('Vendor B')).toBeInTheDocument();
    });
  });

  test('displays dropdown for products in modal', async () => {
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    productsAPI.getAll.mockResolvedValue({ data: mockProducts });
    vendorsAPI.getAll.mockResolvedValue({ data: mockVendors });

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText('➕ New Transaction')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ New Transaction'));

    await waitFor(() => {
      expect(screen.getByText('Select Product')).toBeInTheDocument();
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
    });
  });

  test('displays transactions table', async () => {
    transactionsAPI.getAll.mockResolvedValue({ data: mockTransactions });
    productsAPI.getAll.mockResolvedValue({ data: mockProducts });
    vendorsAPI.getAll.mockResolvedValue({ data: mockVendors });

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  test('displays error message when API fails', async () => {
    transactionsAPI.getAll.mockRejectedValue(new Error('Network Error'));
    productsAPI.getAll.mockRejectedValue(new Error('Network Error'));
    vendorsAPI.getAll.mockRejectedValue(new Error('Network Error'));

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load transactions')).toBeInTheDocument();
    });
  });

  test('calls API endpoints on mount', async () => {
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    productsAPI.getAll.mockResolvedValue({ data: [] });
    vendorsAPI.getAll.mockResolvedValue({ data: [] });

    render(<Transactions />);

    await waitFor(() => {
      expect(transactionsAPI.getAll).toHaveBeenCalled();
      expect(productsAPI.getAll).toHaveBeenCalled();
      expect(vendorsAPI.getAll).toHaveBeenCalled();
    });
  });

  test('modal has create and cancel buttons', async () => {
    transactionsAPI.getAll.mockResolvedValue({ data: [] });
    productsAPI.getAll.mockResolvedValue({ data: mockProducts });
    vendorsAPI.getAll.mockResolvedValue({ data: mockVendors });

    render(<Transactions />);

    await waitFor(() => {
      expect(screen.getByText('➕ New Transaction')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ New Transaction'));

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });
});
