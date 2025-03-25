/**
 * Prettier configuration for the AI-driven Freight Optimization Platform backend services.
 * This file defines code formatting rules to ensure consistent code style across all backend microservices.
 * 
 * Used by prettier version ^3.0.1
 */

module.exports = {
  // Semicolons at the end of statements
  semi: true,
  // Use single quotes instead of double quotes
  singleQuote: true,
  // Add trailing commas wherever possible
  trailingComma: 'all',
  // Line length that the printer will wrap on
  printWidth: 100,
  // Number of spaces per indentation-level
  tabWidth: 2,
  // Print spaces between brackets in object literals
  bracketSpacing: true,
  // Include parentheses around a sole arrow function parameter
  arrowParens: 'avoid',
  // Line endings
  endOfLine: 'lf',
  // Indent with spaces instead of tabs
  useTabs: false,
  // Quote properties in objects only when needed
  quoteProps: 'as-needed',
};