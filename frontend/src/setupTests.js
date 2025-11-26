import '@testing-library/jest-dom';

// Create a div with id="root" to prevent react-modal errors
const root = document.createElement('div');
root.id = 'root';
document.body.appendChild(root);
