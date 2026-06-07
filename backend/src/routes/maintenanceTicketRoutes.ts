import express from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket,
    deleteTicket,
    updateTicketStatus,
    generatePdfReport,
    generateExcelReportAction
} from '../controllers/maintenanceTicketCtrl';

const router = express.Router();

// Apply auth middleware to all maintenance ticket routes
router.use(verifyToken);

// Report endpoints (must be before /:id to avoid conflict)
router.get('/report/pdf', generatePdfReport as any);
router.get('/report/excel', generateExcelReportAction as any);

// CRUD endpoints
router.post('/', createTicket as any);
router.get('/', getTickets as any);
router.get('/:id', getTicketById as any);
router.put('/:id', updateTicket as any);
router.delete('/:id', deleteTicket as any);

// Status Workflow endpoint
router.put('/:id/status', updateTicketStatus as any);

export default router;
