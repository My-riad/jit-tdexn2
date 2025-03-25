import { Router } from 'express';
import ReportingController from '../controllers/reporting.controller';
import { authenticate } from '../../../common/middleware/auth.middleware';

// Create router instance
const router = Router();

// Initialize controller
const reportingController = new ReportingController();

// Apply authentication middleware to all routes
router.use(authenticate);

// =========================================================
// Report Template Routes
// =========================================================

// Create a new report template
router.post('/templates', reportingController.createReportTemplate.bind(reportingController));

// Get all report templates with optional filtering
router.get('/templates', reportingController.getReportTemplates.bind(reportingController));

// Get default report templates by type
router.get('/templates/default', reportingController.getDefaultTemplates.bind(reportingController));

// Get a specific report template by ID
router.get('/templates/:id', reportingController.getReportTemplate.bind(reportingController));

// Update a report template
router.put('/templates/:id', reportingController.updateReportTemplate.bind(reportingController));

// Delete a report template
router.delete('/templates/:id', reportingController.deleteReportTemplate.bind(reportingController));

// Get reports generated from a specific template
router.get('/templates/:id/reports', reportingController.getReportsByTemplate.bind(reportingController));

// Generate a report based on a template
router.post('/templates/:id/generate', reportingController.generateReport.bind(reportingController));

// Schedule a recurring report based on a template
router.post('/templates/:id/schedule', reportingController.scheduleReport.bind(reportingController));

// =========================================================
// Report Routes
// =========================================================

// Get all reports with optional filtering
router.get('/', reportingController.getReports.bind(reportingController));

// Get a specific report by ID
router.get('/:id', reportingController.getReport.bind(reportingController));

// Update a report
router.put('/:id', reportingController.updateReport.bind(reportingController));

// Delete a report
router.delete('/:id', reportingController.deleteReport.bind(reportingController));

// Export a report to a specific format
router.get('/:id/export', reportingController.exportReport.bind(reportingController));

// Publish a report, making it available to users
router.put('/:id/publish', reportingController.publishReport.bind(reportingController));

// Archive a report that is no longer needed
router.put('/:id/archive', reportingController.archiveReport.bind(reportingController));

// Stop a scheduled report from running
router.put('/:id/unschedule', reportingController.unscheduleReport.bind(reportingController));

// Download a report file
router.get('/:id/download', reportingController.downloadReportFile.bind(reportingController));

// =========================================================
// Specialized Report Generation Routes
// =========================================================

// Generate an efficiency report using a default template
router.post('/efficiency', reportingController.generateEfficiencyReport.bind(reportingController));

// Generate a financial report using a default template
router.post('/financial', reportingController.generateFinancialReport.bind(reportingController));

// Generate an operational report using a default template
router.post('/operational', reportingController.generateOperationalReport.bind(reportingController));

// Generate a driver performance report using a default template
router.post('/driver-performance', reportingController.generateDriverPerformanceReport.bind(reportingController));

// Generate a fleet utilization report using a default template
router.post('/fleet-utilization', reportingController.generateFleetUtilizationReport.bind(reportingController));

export default router;