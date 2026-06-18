import { Response } from 'express';
import { MaintenanceTicketModel } from '../models/maintenanceTicket.model';
import { ResourceModel } from '../models/resource.model';
import { generateMaintenanceReportPDF } from '../services/pdfReportService';
import { generateExcelReport } from '../services/exportService';
import { AuthRequest } from '../middleware/auth.middleware';

// Helper for RBAC
const isStaffOrAdmin = (user: any) => {
    if (!user) return false;
    return (
        user.uid === 'dev-user' || 
        user.admin === true || 
        user.role === 'admin' || 
        user.role === 'maintenance'
    );
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { resourceId, title, description, priority } = req.body;

        if (!resourceId || !title || !priority) {
            res.status(400).json({ message: 'Validation error: resourceId, title, and priority are required' });
            return;
        }

        if (!req.user || !req.user.uid) {
            res.status(401).json({ message: 'Unauthorized: User missing from request' });
            return;
        }

        const ticketId = await MaintenanceTicketModel.create({
            resourceId,
            title,
            description: description || '',
            priority,
            createdBy: req.user.uid
        }, req.supabase);

        res.status(201).json({
            message: 'Maintenance ticket created successfully',
            ticketId
        });
    } catch (error) {
        console.error('Error creating maintenance ticket:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getTickets = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const filters: any = {};
        
        if (req.query.status) filters.status = req.query.status;
        if (req.query.priority) filters.priority = req.query.priority;
        if (req.query.resourceId) filters.resourceId = req.query.resourceId;

        // Role-Based Filtering
        if (req.user && !isStaffOrAdmin(req.user)) {
            // Students/Lecturers can only see their own tickets
            filters.createdBy = req.user.uid;
        } else if (req.query.createdBy) {
            filters.createdBy = req.query.createdBy;
        }

        const tickets = await MaintenanceTicketModel.findAll(filters, req.supabase);
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getTicketById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const ticket = await MaintenanceTicketModel.findById(id, req.supabase);
        if (!ticket) {
            res.status(404).json({ message: 'Maintenance ticket not found' });
            return;
        }

        // Enforce RBAC for viewing
        if (req.user && !isStaffOrAdmin(req.user) && ticket.createdBy !== req.user.uid) {
            res.status(403).json({ message: 'Forbidden: You can only view your own tickets' });
            return;
        }

        res.status(200).json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateTicket = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Enforce RBAC for updating mapping to requirement: Only Admin / Maintenance Staff
        if (!req.user || !isStaffOrAdmin(req.user)) {
            res.status(403).json({ message: 'Forbidden: Only administrators or maintenance staff can update tickets' });
            return;
        }

        const id = req.params.id as string;
        const { status, priority, description, assignedTo } = req.body;
        
        const success = await MaintenanceTicketModel.update(id, {
            status,
            priority,
            description,
            assignedTo
        }, req.supabase);

        if (!success) {
            res.status(404).json({ message: 'Maintenance ticket not found' });
            return;
        }

        res.status(200).json({ message: 'Maintenance ticket updated successfully' });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteTicket = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Enforce RBAC for deleting: Only Admin / Maintenance Staff
        if (!req.user || !isStaffOrAdmin(req.user)) {
            res.status(403).json({ message: 'Forbidden: Only administrators or maintenance staff can delete tickets' });
            return;
        }

        const id = req.params.id as string;

        const success = await MaintenanceTicketModel.delete(id, req.supabase);
        if (!success) {
            res.status(404).json({ message: 'Maintenance ticket not found' });
            return;
        }

        res.status(200).json({ message: 'Maintenance ticket deleted successfully' });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const updateTicketStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !isStaffOrAdmin(req.user)) {
            res.status(403).json({ message: 'Forbidden: Only administrators or maintenance staff can update ticket statuses' });
            return;
        }

        const id = req.params.id as string;
        const { status, outcome } = req.body;
        if (!status || !['OPEN', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            res.status(400).json({ message: 'Invalid status provided' });
            return;
        }

        if (status === 'COMPLETED' && outcome && !['Fixed', 'Faulty', 'Decommissioned'].includes(outcome)) {
            res.status(400).json({ message: 'Invalid outcome provided' });
            return;
        }

        const ticket = await MaintenanceTicketModel.findById(id, req.supabase);
        if (!ticket) {
            res.status(404).json({ message: 'Maintenance ticket not found' });
            return;
        }

        const currentStatus = ticket.status;
        const isAdmin = req.user.admin === true || req.user.role === 'admin' || req.user.uid === 'dev-user';

        // Check valid transitions
        let validTransition = false;
        if (currentStatus === 'OPEN' && status === 'IN_PROGRESS') {
            validTransition = true;
        } else if (currentStatus === 'IN_PROGRESS' && status === 'COMPLETED') {
            validTransition = true;
        } else if (isAdmin) {
            // Admin override allows any transition
            validTransition = true;
        }

        if (!validTransition) {
            res.status(400).json({ message: `Invalid status transition from ${currentStatus} to ${status}` });
            return;
        }

        // Prepare update data according to story: store completion timestamp
        const updateData: any = { status };
        if (status === 'COMPLETED') {
            updateData.completed_at = new Date();
            if (outcome) updateData.outcome = outcome;
        }

        const success = await MaintenanceTicketModel.update(id, updateData, req.supabase);
        if (!success) {
            res.status(500).json({ message: 'Failed to update ticket status' });
            return;
        }

        // Automatically update the related resource status post-maintenance
        if (status === 'COMPLETED' && ticket.resourceId) {
            let resourceStatus = 'Available'; // Default if fixed
            
            if (outcome === 'Faulty') {
                resourceStatus = 'Under Maintenance';
            } else if (outcome === 'Decommissioned') {
                resourceStatus = 'Inactive';
            }
            // If fixed (default), status = "Available"
            
            await ResourceModel.update(ticket.resourceId, { availability_status: resourceStatus }, req.supabase);
        }

        res.status(200).json({ 
            message: 'Maintenance ticket status updated successfully', 
            status,
            resourceUpdated: status === 'COMPLETED' 
        });
    } catch (error) {
        console.error('Error updating ticket status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const generatePdfReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !isStaffOrAdmin(req.user)) {
            res.status(403).json({ message: 'Forbidden: Only administrators or maintenance staff can generate reports' });
            return;
        }

        const filters: any = {};
        
        if (req.query.status) filters.status = req.query.status;
        if (req.query.priority) filters.priority = req.query.priority;
        if (req.query.resourceId) filters.resourceId = req.query.resourceId;

        // RBAC constraint for Staff
        const isAdmin = req.user.admin === true || req.user.role === 'admin' || req.user.uid === 'dev-user';
        if (!isAdmin && req.user.role === 'maintenance') {
            filters.assignedTo = req.user.uid;
        }

        const tickets = await MaintenanceTicketModel.findAll(filters, req.supabase);

        if (!tickets || tickets.length === 0) {
            res.status(404).json({ message: 'No data available to generate report' });
            return;
        }

        // Set Headers for PDF Download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="maintenance-report.pdf"');

        // Pipe directly to response
        generateMaintenanceReportPDF(tickets, res, filters);
        
        // Note: res is automatically finished when the stream closes inside PDFKit
    } catch (error) {
        console.error('Error generating PDF report:', error);
        res.status(500).json({ message: 'Internal server error during PDF generation' });
    }
};

export const generateExcelReportAction = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user || !isStaffOrAdmin(req.user)) {
            res.status(403).json({ message: 'Forbidden: Only administrators or maintenance staff can generate reports' });
            return;
        }

        const filters: any = {};
        if (req.query.status) filters.status = req.query.status;
        if (req.query.priority) filters.priority = req.query.priority;
        if (req.query.resourceId) filters.resourceId = req.query.resourceId;

        const tickets = await MaintenanceTicketModel.findAll(filters, req.supabase);

        if (!tickets || tickets.length === 0) {
            res.status(404).json({ message: 'No data available to generate report' });
            return;
        }

        const excelData = tickets.map(t => ({
            'Ticket ID': t.id,
            'Title': t.title,
            'Resource ID': t.resourceId,
            'Description': t.description,
            'Priority': t.priority,
            'Status': t.status,
            'Created By': t.createdBy,
            'Assigned To': t.assignedTo || 'Unassigned',
            'Created Date': t.created_at ? new Date(t.created_at).toLocaleString() : 'N/A',
            'Completed Date': t.completed_at ? new Date(t.completed_at).toLocaleString() : 'N/A',
            'Outcome': t.outcome || 'N/A'
        }));

        generateExcelReport(res, 'maintenance-report.xlsx', [
            { name: 'Maintenance Tickets', data: excelData }
        ]);
    } catch (error) {
        console.error('Error generating Excel report:', error);
        res.status(500).json({ message: 'Internal server error during Excel generation' });
    }
};
