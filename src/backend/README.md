# AI-driven Freight Optimization Platform - Backend

Backend services for the AI-driven Freight Optimization Platform, a revolutionary logistics solution designed to transform the trucking industry by eliminating deadhead miles through dynamic load coordination.

## Architecture Overview

The backend is built on a microservices architecture with the following key components:

- **API Gateway**: Entry point for all client applications, providing routing, authentication, and request/response transformation
- **Auth Service**: Manages user authentication, authorization, and access control
- **Driver Service**: Handles driver profiles, preferences, availability, and HOS compliance
- **Load Service**: Manages the complete lifecycle of loads from creation to delivery
- **Load Matching Service**: Matches drivers with loads based on AI optimization algorithms
- **Tracking Service**: Monitors real-time position data for trucks and loads
- **Gamification Service**: Implements scoring, rewards, and incentives for drivers
- **Market Intelligence Service**: Analyzes market conditions and adjusts pricing
- **Optimization Engine**: Executes AI algorithms for network-wide efficiency
- **Notification Service**: Delivers alerts and updates across multiple channels
- **Integration Service**: Connects with external systems like ELDs, TMSs, and payment processors
- **Data Service**: Provides analytics, reporting, and data export capabilities
- **Event Bus**: Facilitates asynchronous communication between services
- **Cache Service**: Manages centralized Redis cache operations

### Communication Patterns

Services communicate using a combination of:

- **Synchronous REST**: For direct request/response interactions
- **Asynchronous Events**: Using Kafka for event-driven communication
- **WebSockets**: For real-time updates like position tracking

### Data Storage

The platform uses multiple specialized databases:

- **PostgreSQL**: Primary relational database with PostGIS for geospatial data
- **TimescaleDB**: Time-series database for position history and telemetry
- **Redis**: In-memory data store for caching and real-time data
- **MongoDB**: Document database for flexible schema data

## Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Docker and Docker Compose
- PostgreSQL (for local development without Docker)
- Redis (for local development without Docker)

## Getting Started

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and update the variables
3. Install dependencies:
   ```bash
   npm install
   ```

### Running with Docker

The easiest way to run the complete backend stack is using Docker Compose:

```bash
npm run docker:up
```

This will start all services and their dependencies. To view logs:

```bash
npm run docker:logs
```

To stop all services:

```bash
npm run docker:down
```

### Running Locally

To run all services in development mode:

```bash
npm run dev
```

To run a specific service:

```bash
npm run dev:service-name
# Example: npm run dev:api-gateway
```

### Database Setup

Initialize the database with migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

To rollback migrations:

```bash
npm run db:rollback
```

## Project Structure

The backend follows a monorepo structure using npm workspaces:

```
src/backend/
├── api-gateway/         # API Gateway service
├── auth-service/        # Authentication service
├── cache-service/       # Cache management service
├── common/              # Shared code, interfaces, and utilities
├── data-service/        # Analytics and reporting service
├── driver-service/      # Driver management service
├── event-bus/           # Event management service
├── gamification-service/# Driver gamification service
├── integration-service/ # External system integrations
├── load-matching-service/ # Load matching and optimization
├── load-service/        # Load management service
├── market-intelligence-service/ # Market analysis service
├── notification-service/# Multi-channel notifications
├── optimization-engine/ # AI optimization algorithms
├── tracking-service/    # Real-time position tracking
├── database/            # Database migrations and seeds
├── docker-compose.yml   # Docker Compose configuration
├── package.json         # Root package.json with workspaces
└── tsconfig.json        # Base TypeScript configuration
```

Each service follows a similar structure:

```
service-name/
├── src/
│   ├── app.ts           # Express application setup
│   ├── index.ts         # Service entry point
│   ├── config/          # Service-specific configuration
│   ├── controllers/     # API controllers
│   ├── models/          # Data models
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── validators/      # Input validation
│   ├── consumers/       # Kafka consumers
│   └── producers/       # Kafka producers
├── tests/
│   ├── unit/           # Unit tests
│   └── integration/    # Integration tests
├── Dockerfile          # Docker configuration
├── package.json        # Service dependencies
└── tsconfig.json       # TypeScript configuration
```

## Development Workflow

### Code Style and Linting

The project uses ESLint and Prettier for code quality and formatting:

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

Git hooks (via Husky) automatically run linting and formatting on commit.

### Testing

The project uses Jest for testing:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:coverage

# Run tests for a specific service
npm run test:service-name
# Example: npm run test:load-service
```

### Building

To build all services:

```bash
npm run build
```

To build a specific service:

```bash
npm run build:service-name
# Example: npm run build:api-gateway
```

### Adding New Services

1. Create a new directory for your service
2. Add the service to the `workspaces` array in the root `package.json`
3. Add the service to the `references` array in the root `tsconfig.json`
4. Add the service to `docker-compose.yml`
5. Add build, start, and test scripts to the root `package.json`

## API Documentation

API documentation is available through Swagger UI when running the API Gateway service:

- Development: http://localhost:3000/api-docs

The Swagger documentation is generated from the OpenAPI specification in `api-gateway/src/swagger/swagger.json`.

## Deployment

The platform is designed to be deployed on Kubernetes. Deployment configurations are available in the `infrastructure/kubernetes` directory.

CI/CD pipelines are configured using GitHub Actions in the `.github/workflows` directory:

- `backend-ci.yml`: Runs tests and linting on pull requests
- `backend-cd.yml`: Builds and deploys services on merge to main branch

## Common Tasks

### Adding a New API Endpoint

1. Create a controller function in the appropriate service
2. Add a route in the service's routes directory
3. Register the route in the service's app.ts
4. Update the API Gateway's service registry if needed
5. Add tests for the new endpoint

### Creating a Database Migration

```bash
cd database
npx knex migrate:make migration_name
```

Edit the generated migration file in `database/migrations/`.

### Adding a New Event

1. Define the event schema in `event-bus/src/schemas/`
2. Create a producer in the source service
3. Create a consumer in the target service(s)
4. Register the topic in `event-bus/src/config/topics.ts`

## Troubleshooting

Common issues and their solutions:

- **Service won't start**: Check the logs for errors, ensure all dependencies are running
- **Database connection issues**: Verify database credentials in .env file
- **Kafka connection errors**: Ensure Kafka and Zookeeper are running
- **TypeScript errors**: Run `npm run build` to check for compilation errors
- **Test failures**: Run tests with `--verbose` flag for detailed output

## Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Ensure tests pass and linting is clean
4. Submit a pull request to `develop`
5. Request review from team members

Please follow the established code style and include tests for new features.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.