import React, { StrictMode } from 'react'; // Core React library for component creation // version ^18.2.0
import { createRoot } from 'react-dom/client'; // React 18 API for creating a root to render React components // version ^18.2.0

import App from './App'; // Import the root App component that contains the application structure
import GlobalStyles from '../../shared/styles/globalStyles'; // Import global styles for consistent styling across the application

// file header: Entry point for the Carrier Portal web application. Initializes React and renders the root App component.

// LD1: DOM element where the React application will be mounted
const rootElement = document.getElementById('root');

// code comment: Ensure the root element exists before attempting to render
if (!rootElement) {
  // LD1: Log error to console if root element not found
  console.error('Failed to find the root element to mount React app.');
  throw new Error('Failed to find root element');
}

// LD1: React 18 root instance for rendering the application
const root = createRoot(rootElement);

// LD1: Render the App component inside React.StrictMode for better development practices
root.render(
  <StrictMode>
    <GlobalStyles />
    <App />
  </StrictMode>
);