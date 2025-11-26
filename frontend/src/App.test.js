import { render, screen } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import axios from 'axios';

// Mock axios to prevent network errors during tests
jest.mock('axios');

// Mock react-table to prevent potential infinite loops or errors in tests
jest.mock('react-table', () => ({
  useTable: () => ({
    getTableProps: () => ({}),
    getTableBodyProps: () => ({}),
    headerGroups: [],
    rows: [],
    prepareRow: () => {},
  }),
}));

test('renders the main application header', () => {
  // Configure mock responses for axios
  axios.get.mockResolvedValue({ data: [] });
  axios.post.mockResolvedValue({ data: {} });
  axios.put.mockResolvedValue({ data: {} });
  axios.delete.mockResolvedValue({ data: {} });

  render(
    <Router>
      <App />
    </Router>
  );
  const headerElement = screen.getByText(/Intelligent POS System/i);
  expect(headerElement).toBeInTheDocument();
});
