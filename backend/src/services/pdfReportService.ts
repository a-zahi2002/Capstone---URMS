import PDFDocument from 'pdfkit';
import { MaintenanceTicket } from '../models/maintenanceTicket.model';

export const generateMaintenanceReportPDF = (
    tickets: MaintenanceTicket[],
    stream: NodeJS.WritableStream,
    filtersApplied: any
) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    
    // Pipe the PDF document to the provided write stream (HTTP Response)
    doc.pipe(stream);

    // Build statistics
    const total = tickets.length;
    let openCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    tickets.forEach(t => {
        if (t.status === 'OPEN') openCount++;
        else if (t.status === 'IN_PROGRESS') inProgressCount++;
        else if (t.status === 'COMPLETED') completedCount++;
    });

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Maintenance Report - URMS', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text('University Resource Management System', { align: 'center' });
    doc.moveDown(2);

    // Summary Section
    doc.fontSize(14).font('Helvetica-Bold').text('Summary Section');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    
    // Draw summary rectangle
    doc.rect(50, doc.y, 500, 80).stroke();
    doc.moveDown(1);
    
    doc.text(`Total Maintenance Tickets: ${total}`, 60, doc.y);
    doc.text(`Open Tickets: ${openCount}`, 60, doc.y + 15);
    doc.text(`In Progress Tickets: ${inProgressCount}`, 60, doc.y + 30);
    doc.text(`Completed Tickets: ${completedCount}`, 60, doc.y + 45);

    // Move Y cursor past the box
    doc.y += 65;

    // Optional Filters indicator
    if (Object.keys(filtersApplied).length > 0) {
        doc.moveDown(1);
        doc.font('Helvetica-Oblique').text(`Filters Applied: ${JSON.stringify(filtersApplied)}`, 50);
    }

    doc.moveDown(2);

    // Ticket Details Table header
    doc.fontSize(14).font('Helvetica-Bold').text('Ticket Details');
    doc.moveDown(1);

    // Sequential Listing
    tickets.forEach((t) => {
        doc.fontSize(11).font('Helvetica-Bold').text(`Ticket #${t.id} - ${t.title || 'No Title'}`);
        doc.fontSize(10).font('Helvetica');
        
        doc.text(`Resource ID: ${t.resourceId}`);
        doc.text(`Issue Description: ${t.description}`);
        doc.text(`Priority: ${t.priority}`);
        doc.text(`Status: ${t.status}`);
        
        const dateStr = t.created_at ? new Date(t.created_at).toLocaleString() : 'N/A';
        doc.text(`Created Date: ${dateStr}`);
        
        doc.moveDown(1.5);

        // Page break calculation mapping to standard A4 size limits
        if (doc.y > 680) {
            doc.addPage();
        }
    });

    // Global Footer Generation mapping using page count
    const pages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
    for (let i = 0; i < pages; i++) {
        if (doc.switchToPage) doc.switchToPage(i);
        doc.fontSize(8).font('Helvetica-Oblique');
        doc.text(`Generated Date/Time: ${new Date().toLocaleString()}  |  Maintenance Reporting Module`, 50, 750, { align: 'center', lineBreak: false });
    }

    // Finalize generating the document
    doc.end();
};
