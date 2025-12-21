import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Vendors from './Vendors';
import { vendorsAPI } from '../services/api';
import { mockUseTable, createModalMock, mockVendors } from '../testUtils';

// Mock the API module
jest.mock('../services/api');

// Mock react-table using shared utility
jest.mock('react-table', () => ({
  useTable: (...args) => require('../testUtils').mockUseTable(...args),
}));

// Mock react-modal using shared utility
jest.mock('react-modal', () => require('../testUtils').createModalMock());

describe('Vendors Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    vendorsAPI.getAll.mockReturnValue(new Promise(() => {}));

    render(<Vendors />);
    expect(screen.getByText('Loading vendors...')).toBeInTheDocument();
  });

  test('displays vendors page title after loading', async () => {
    vendorsAPI.getAll.mockResolvedValue({ data: mockVendors });

    render(<Vendors />);

    await waitFor(() => {
      expect(screen.getByText('🏢 Vendors Management')).toBeInTheDocument();
    });
  });

  test('shows add vendor button', async () => {
    vendorsAPI.getAll.mockResolvedValue({ data: [] });

    render(<Vendors />);

    await waitFor(() => {
      expect(screen.getByText('➕ Add Vendor')).toBeInTheDocument();
    });
  });

  test('opens modal when Add Vendor button is clicked', async () => {
    vendorsAPI.getAll.mockResolvedValue({ data: [] });

    render(<Vendors />);

    await waitFor(() => {
      expect(screen.getByText('➕ Add Vendor')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ Add Vendor'));

    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Add New Vendor')).toBeInTheDocument();
    });
  });

  test('displays vendor form fields in modal', async () => {
    vendorsAPI.getAll.mockResolvedValue({ data: [] });

    render(<Vendors />);

    await waitFor(() => {
      expect(screen.getByText('➕ Add Vendor')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ Add Vendor'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Vendor Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Phone')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Address')).toBeInTheDocument();
    });
  });

  test('displays error message when API fails', async () => {
    vendorsAPI.getAll.mockRejectedValue(new Error('Network Error'));

    render(<Vendors />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load vendors')).toBeInTheDocument();
    });
  });

  test('calls getAll API on mount', async () => {
    vendorsAPI.getAll.mockResolvedValue({ data: [] });

    render(<Vendors />);

    await waitFor(() => {
      expect(vendorsAPI.getAll).toHaveBeenCalled();
    });
  });

  test('displays vendors table', async () => {
    vendorsAPI.getAll.mockResolvedValue({ data: mockVendors });

    render(<Vendors />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  test('modal shows create button for new vendor', async () => {
    vendorsAPI.getAll.mockResolvedValue({ data: [] });

    render(<Vendors />);

    await waitFor(() => {
      expect(screen.getByText('➕ Add Vendor')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ Add Vendor'));

    await waitFor(() => {
      expect(screen.getByText('Create')).toBeInTheDocument();
    });
  });

  test('modal has cancel button', async () => {
    vendorsAPI.getAll.mockResolvedValue({ data: [] });

    render(<Vendors />);

    await waitFor(() => {
      expect(screen.getByText('➕ Add Vendor')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ Add Vendor'));

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });
});
