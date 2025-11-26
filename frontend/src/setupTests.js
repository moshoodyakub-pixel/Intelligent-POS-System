import '@testing-library/jest-dom';
import axios from 'axios';

// Create a div with id="root" to prevent react-modal errors
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);

// Mock axios to prevent network errors
jest.mock('axios');
axios.get.mockResolvedValue({ data: [] });
axios.post.mockResolvedValue({ data: {} });
axios.put.mockResolvedValue({ data: {} });
axios.delete.mockResolvedValue({ data: {} });

// Mock react-table to prevent infinite loop
jest.mock('react-table', () => ({
  useTable: () => ({
    getTableProps: () => ({}),
    getTableBodyProps: () => ({}),
    headerGroups: [],
    rows: [],
    prepareRow: () => {},
  }),
}));
