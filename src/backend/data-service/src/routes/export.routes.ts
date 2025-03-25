import express from 'express'; // express@^4.18.2
import Joi from 'joi'; // joi@^17.9.2
import { authenticate } from '../../../common/middleware/auth.middleware'; // src/backend/common/middleware/auth.middleware.ts
import { validateBody, validateParams, validateQuery } from '../../../common/middleware/validation.middleware'; // src/backend/common/middleware/validation.middleware.ts
import { ExportController } from '../controllers/export.controller'; // src/backend/data-service/src/controllers/export.controller.ts
import { ExportService } from '../services/export.service'; // src/backend/data-service/src/services/export.service.ts
import { AnalyticsService } from '../services/analytics.service'; // src/backend/data-service/src/services/analytics.service.ts
import { DataWarehouseService } from '../services/data-warehouse.service'; // src/backend/data-service/src/services/data-warehouse.service.ts

// Create a new Express router
const exportRouter = express.Router();

/**
 * Configures and returns an Express router with all export-related routes
 * @returns Configured Express router with export routes
 */
function configureExportRoutes(): express.Router {
  // Create a new Express router instance
  const router = express.Router();

  // Initialize services (AnalyticsService, DataWarehouseService, ExportService)
  const analyticsService = new AnalyticsService(new DataWarehouseService());
  const dataWarehouseService = new DataWarehouseService();
  const exportService = new ExportService(analyticsService, dataWarehouseService);

  // Initialize the ExportController with the ExportService
  const exportController = new ExportController(exportService);

  // Define validation schemas for request validation
  const exportSchema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(''),
    format: Joi.string().valid('csv', 'excel', 'pdf', 'json').required(),
    fileName: Joi.string().required(),
    queryId: Joi.string(),
    reportId: Joi.string(),
    filters: Joi.object(),
    parameters: Joi.object(),
    includeHeaders: Joi.boolean(),
    delimiter: Joi.string(),
    sheetName: Joi.string()
  });

  const exportIdSchema = Joi.object({
    id: Joi.string().required()
  });

  const exportQuerySchema = Joi.object({
    query: Joi.string(),
    status: Joi.string()
  });

  const exportQueryParamsSchema = Joi.object({
    queryId: Joi.string().required(),
    format: Joi.string().valid('csv', 'excel', 'pdf', 'json').required(),
    fileName: Joi.string().required(),
    parameters: Joi.object()
  });

  // Configure routes for export management (create, get, list, delete)
  router.post('/', authenticate, validateBody(exportSchema), (req, res, next) => exportController.createExport(req, res, next));
  router.get('/:id', authenticate, validateParams(exportIdSchema), (req, res, next) => exportController.getExport(req, res, next));
  router.get('/', authenticate, validateQuery(exportQuerySchema), (req, res, next) => exportController.getExports(req, res, next));
  router.delete('/:id', authenticate, validateParams(exportIdSchema), (req, res, next) => exportController.deleteExport(req, res, next));

  // Configure routes for export processing and downloading
  router.post('/:id/process', authenticate, validateParams(exportIdSchema), (req, res, next) => exportController.processExport(req, res, next));
  router.get('/:id/download', authenticate, validateParams(exportIdSchema), (req, res, next) => exportController.downloadExport(req, res, next));
  router.post('/create-and-process', authenticate, validateBody(exportSchema), (req, res, next) => exportController.createAndProcessExport(req, res, next));

  // Configure routes for direct export of query results
  router.post('/query-results', authenticate, validateBody(exportQueryParamsSchema), (req, res, next) => exportController.exportQueryResults(req, res, next));

  // Return the configured router
  return router;
}

exportRouter.use(configureExportRoutes());

// Export the configured export router for use in the application
export default exportRouter;