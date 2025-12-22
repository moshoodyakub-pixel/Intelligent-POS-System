import '@testing-library/jest-dom';

// Polyfill TextEncoder/TextDecoder for jsdom (required by react-router-dom v7+)
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Create a div with id="root" to prevent react-modal errors
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);
