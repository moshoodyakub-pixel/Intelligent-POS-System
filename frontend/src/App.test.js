import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dashboard title', () => {
  render(<App />);
  const linkElement = screen.getByText(/Intelligent POS System/i);
  expect(linkElement).toBeInTheDocument();
});
