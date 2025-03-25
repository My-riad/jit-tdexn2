# AI-driven Freight Optimization Platform - Web Applications

This directory contains the web applications for the AI-driven Freight Optimization Platform, including the Carrier Management Portal, Shipper Interface, and Driver Mobile Application.

## Project Structure

The web applications are organized as a monorepo with the following structure:

- `carrier-portal/`: Web application for fleet operators and dispatchers
- `shipper-portal/`: Web application for freight owners
- `driver-app/`: React Native mobile application for truck drivers
- `common/`: Shared code, interfaces, and utilities used across applications
- `shared/`: Shared UI components, styles, and assets

## Technology Stack

- **Frontend Framework**: React 18.2+
- **Language**: TypeScript 5.0+
- **State Management**: Redux with Redux Saga/Thunk
- **Styling**: Styled Components
- **Routing**: React Router
- **Form Management**: Formik with Yup validation
- **Data Visualization**: D3.js
- **Mapping**: Mapbox GL
- **Mobile**: React Native for the driver app
- **Testing**: Jest, React Testing Library
- **Building**: Webpack
- **Linting**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- For the driver app: React Native development environment

### Installation

1. Clone the repository
2. Navigate to the web directory: `cd src/web`
3. Install dependencies: `npm install`
4. Create a `.env` file based on `.env.example`

### Running the Applications

- **Carrier Portal**: `npm run start:carrier`
- **Shipper Portal**: `npm run start:shipper`
- **Driver App**: 
  - Navigate to the driver app directory: `cd driver-app`
  - Install dependencies: `npm install`
  - iOS: `npm run ios`
  - Android: `npm run android`

## Development

### Code Organization

The codebase follows a feature-based organization within each application:

```
app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── store/          # Redux store, actions, reducers
│   ├── services/       # API and business logic services
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── styles/         # Global styles and themes
│   └── types/          # TypeScript type definitions
```

### Shared Code

Common code is shared through the `common/` and `shared/` directories:

- `common/`: Non-UI code like interfaces, utilities, and services
- `shared/`: UI components, styles, and assets that are used across applications

### Coding Standards

- Follow the TypeScript and React best practices
- Use functional components with hooks
- Maintain strict type safety with TypeScript
- Write unit tests for all components and utilities
- Follow the established design system for consistent UI

## Testing

### Running Tests

- Run all tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Generate coverage report: `npm run test:coverage`

### Testing Strategy

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test interactions between components
- **E2E Tests**: Test complete user flows (implemented separately)

### Mocking

API requests are mocked using Mock Service Worker (MSW) for testing.

## Building for Production

### Build Commands

- Build all applications: `npm run build`
- Build carrier portal: `npm run build:carrier`
- Build shipper portal: `npm run build:shipper`
- Build driver app:
  - Android: `cd driver-app && npm run build:android`
  - iOS: `cd driver-app && npm run build:ios`

### Deployment

The build artifacts are deployed through the CI/CD pipeline configured in the `.github/workflows/` directory.

## Application Features

### Carrier Management Portal

- Fleet dashboard with real-time truck positions
- Load management and assignment
- Driver performance analytics
- Network optimization recommendations
- Integration with TMS systems

### Shipper Interface

- Load creation and management
- Carrier recommendation based on optimization scores
- Real-time shipment tracking
- Rate management and bidding
- Performance analytics

### Driver Mobile Application

- Load recommendation feed with AI-optimized matches
- Interactive map with real-time position tracking
- Earnings and efficiency score dashboard
- Gamification elements (leaderboards, achievements)
- Smart Hub and relay coordination

## Contributing

### Development Workflow

1. Create a feature branch from `development`
2. Implement your changes with tests
3. Ensure all tests pass and linting is clean
4. Submit a pull request to `development`

### Code Reviews

All code changes require a review before merging. See the `.github/pull_request_template.md` for guidance.

## Troubleshooting

### Common Issues

- **Missing dependencies**: Run `npm install` in the root directory
- **Environment variables**: Ensure `.env` file is properly configured
- **TypeScript errors**: Run `npm run typecheck` to identify type issues
- **React Native setup**: Refer to the React Native documentation for platform-specific setup