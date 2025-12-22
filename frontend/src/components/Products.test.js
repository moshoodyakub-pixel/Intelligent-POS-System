import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Products from './Products';
import { productsAPI, vendorsAPI } from '../services/api';
import { mockProducts, mockVendors } from '../testUtils';

// Mock the API module
jest.mock('../services/api');

describe('Products Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    productsAPI.getAll.mockReturnValue(new Promise(() => {}));
    vendorsAPI.getAll.mockReturnValue(new Promise(() => {}));

    render(<Products />);
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  test('displays products table header after loading', async () => {
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts, pagination: {} } });
    vendorsAPI.getAll.mockResolvedValue({ data: { items: mockVendors } });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('📦 Products Management')).toBeInTheDocument();
    });
  });

  test('displays products in table', async () => {
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts, pagination: {} } });
    vendorsAPI.getAll.mockResolvedValue({ data: { items: mockVendors } });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('Product A')).toBeInTheDocument();
      expect(screen.getByText('Product B')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('$149.99')).toBeInTheDocument();
    });
  });

  test('displays table headers correctly', async () => {
    productsAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    vendorsAPI.getAll.mockResolvedValue({ data: { items: [] } });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Vendor')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  test('shows add product button', async () => {
    productsAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    vendorsAPI.getAll.mockResolvedValue({ data: { items: [] } });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('➕ Add Product')).toBeInTheDocument();
    });
  });

  test('opens form when Add Product button is clicked', async () => {
    productsAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    vendorsAPI.getAll.mockResolvedValue({ data: { items: [] } });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('➕ Add Product')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('➕ Add Product'));

    await waitFor(() => {
      expect(screen.getByText('➕ Add New Product')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Product Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Price')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Quantity')).toBeInTheDocument();
    });
  });

  test('closes form when button is clicked again', async () => {
    productsAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    vendorsAPI.getAll.mockResolvedValue({ data: { items: [] } });

    render(<Products />);

    await waitFor(() => {
      expect(screen.getByText('➕ Add Product')).toBeInTheDocument();
    });

    // Open form
    fireEvent.click(screen.getByText('➕ Add Product'));
    await waitFor(() => {
      expect(screen.getByText('➕ Add New Product')).toBeInTheDocument();
    });

    // Close form
    fireEvent.click(screen.getByText('✕ Close Form'));
    await waitFor(() => {
      expect(screen.queryByText('➕ Add New Product')).not.toBeInTheDocument();
    });
  });

  test('displays edit and delete buttons for each product', async () => {
    productsAPI.getAll.mockResolvedValue({ data: { items: mockProducts, pagination: {} } });
    vendorsAPI.getAll.mockResolvedValue({ data: { items: mockVendors } });

    render(<Products />);

    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });
  });

  test('displays error message when API fails', async () => {
    productsAPI.getAll.mockRejectedValue(new Error('Network Error'));
    vendorsAPI.getAll.mockRejectedValue(new Error('Network Error'));

    render(<Products />);

    await waitFor(() => {
      // Component shows error in both notification and error div
      const errorElements = screen.getAllByText('Failed to load products');
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  test('calls API endpoints on mount', async () => {
    productsAPI.getAll.mockResolvedValue({ data: { items: [], pagination: {} } });
    vendorsAPI.getAll.mockResolvedValue({ data: { items: [] } });

    render(<Products />);

    await waitFor(() => {
      expect(productsAPI.getAll).toHaveBeenCalled();
      expect(vendorsAPI.getAll).toHaveBeenCalled();
    });
  });
});
