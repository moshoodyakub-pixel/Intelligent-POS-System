/**
 * Shared test utilities and mocks for frontend tests.
 */

// Mock for react-table
export const mockUseTable = jest.fn(({ columns, data }) => ({
  getTableProps: () => ({ role: 'table' }),
  getTableBodyProps: () => ({}),
  headerGroups: columns.map((col, idx) => ({
    getHeaderGroupProps: () => ({ key: idx }),
    headers: [{ 
      getHeaderProps: () => ({ key: col.Header }), 
      render: () => col.Header 
    }]
  })),
  rows: data.map((row, idx) => ({
    getRowProps: () => ({ key: idx }),
    original: row,
    cells: columns.map((col, colIdx) => ({
      getCellProps: () => ({ key: colIdx }),
      render: (type) => {
        if (type === 'Cell' && col.Cell) {
          return col.Cell({ row: { original: row }, value: row[col.accessor] });
        }
        return row[col.accessor];
      }
    }))
  })),
  prepareRow: jest.fn(),
}));

// Mock for react-modal
export const createModalMock = () => {
  const Modal = ({ isOpen, children, onRequestClose }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="modal">
        {children}
        <button onClick={onRequestClose}>Close Modal</button>
      </div>
    );
  };
  Modal.setAppElement = jest.fn();
  return Modal;
};

// Sample test data
export const mockVendors = [
  { id: 1, name: 'Vendor A', email: 'a@test.com', phone: '123-456-7890', address: '123 Main St' },
  { id: 2, name: 'Vendor B', email: 'b@test.com', phone: '098-765-4321', address: '456 Oak Ave' },
];

export const mockProducts = [
  { id: 1, name: 'Product A', description: 'Desc A', price: 99.99, quantity: 100, vendor_id: 1 },
  { id: 2, name: 'Product B', description: 'Desc B', price: 149.99, quantity: 50, vendor_id: 2 },
];

export const mockTransactions = [
  { id: 1, vendor_id: 1, product_id: 1, quantity: 5, total_price: 499.95, transaction_date: '2025-01-01T00:00:00' },
  { id: 2, vendor_id: 2, product_id: 2, quantity: 3, total_price: 449.97, transaction_date: '2025-01-15T00:00:00' },
];

export const mockForecasts = [
  { id: 1, product_id: 1, forecasted_quantity: 150, forecasted_price: 89.99, forecast_date: '2025-01-01T00:00:00' },
  { id: 2, product_id: 2, forecasted_quantity: 75, forecasted_price: 139.99, forecast_date: '2025-01-15T00:00:00' },
];
