import { setupServer } from 'msw/node';
import handlers from './handlers';

/**
 * Create a Mock Service Worker server instance configured with
 * the imported handlers for testing API requests.
 * 
 * This server intercepts network requests during tests and provides 
 * mock responses defined in handlers.ts, allowing frontend components
 * to be tested in isolation without backend dependencies.
 * 
 * @see {handlers} for the specific request handlers and mock responses
 */
const server = setupServer(...handlers);

export default server;