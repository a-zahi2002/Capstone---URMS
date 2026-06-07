import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { Response } from 'express';
import { Writable } from 'stream';

// ─── Types ────────────────────────────────────────────────────

export interface PDFReportOptions {
    title: string;
    subtitle?: string;
    summaryItems?: { label: string; value: string | number }[];
    sections: {
        title: string;
        headers: string[];
        rows: (string | number)[][];
    }[];
}

export interface ExcelSheetDef {
    name: string;
    data: any[];
}

// ─── Shared PDF Builder Core ──────────────────────────────────

/**
 * Internal: populates a PDFDocument with the standard URMS report layout.
 * Called by both the streaming response variant and the buffer variant.
 */
function buildPdfDocument(doc: PDFKit.PDFDocument, options: PDFReportOptions) {
    // 1. Header
    doc.fontSize(22).font('Helvetica-Bold').text(options.title, { align: 'center' });
    if (options.subtitle) {
        doc.moveDown(0.2);
        doc.fontSize(12).font('Helvetica').text(options.subtitle, { align: 'center' });
    }
    doc.moveDown(1.5);

    // 2. Summary Box
    if (options.summaryItems && options.summaryItems.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Overview Summary');
        doc.moveDown(0.5);
        const startY = doc.y;
        const boxHeight = (options.summaryItems.length * 20) + 20;
        doc.rect(50, startY, 500, boxHeight).stroke();
        doc.fontSize(10).font('Helvetica');
        options.summaryItems.forEach((item, i) => {
            doc.text(`${item.label}:`, 70, startY + 15 + (i * 20));
            doc.font('Helvetica-Bold').text(`${item.value}`, 250, startY + 15 + (i * 20));
            doc.font('Helvetica');
        });
        doc.y = startY + boxHeight + 20;
    }

    // 3. Data Sections (Tables)
    options.sections.forEach((section) => {
        if (doc.y > 650) doc.addPage();
        doc.moveDown(1);
        doc.fontSize(16).font('Helvetica-Bold').text(section.title);
        doc.moveDown(0.8);

        const startX = 50;
        const colWidth = 500 / Math.max(section.headers.length, 1);

        // Print headers
        const printHeaders = () => {
            doc.fontSize(10).font('Helvetica-Bold');
            section.headers.forEach((header, i) => {
                doc.text(header, startX + (i * colWidth), doc.y, { width: colWidth - 4, align: 'left' });
            });
            doc.moveDown(0.5);
            doc.moveTo(startX, doc.y).lineTo(startX + 500, doc.y).stroke();
            doc.moveDown(0.5);
            doc.font('Helvetica');
        };

        printHeaders();

        section.rows.forEach((row) => {
            if (doc.y > 700) {
                doc.addPage();
                printHeaders();
            }
            const rowY = doc.y;
            let maxHeight = 0;
            row.forEach((cell, i) => {
                const cellText = String(cell);
                const opts: PDFKit.Mixins.TextOptions = { width: colWidth - 10, align: 'left' };
                maxHeight = Math.max(maxHeight, doc.heightOfString(cellText, opts));
                doc.text(cellText, startX + (i * colWidth), rowY, opts);
            });
            doc.y = rowY + maxHeight + 10;
        });
    });

    // 4. Footer (all pages)
    const pages = doc.bufferedPageRange().count;
    for (let i = 0; i < pages; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).font('Helvetica-Oblique');
        const footerText = `Generated on: ${new Date().toLocaleString()} | URMS Analytics Engine | Page ${i + 1} of ${pages}`;
        doc.text(footerText, 50, 750, { align: 'center', width: 500 });
    }
}

// ─── Stream variant (HTTP response) ──────────────────────────

/**
 * Generates a PDF report and streams it directly to the HTTP response.
 */
export const generatePDFReport = (res: Response, options: PDFReportOptions) => {
    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    doc.pipe(res);
    buildPdfDocument(doc, options);
    doc.end();
};

// ─── Buffer variant (automated delivery) ─────────────────────

/**
 * Generates a PDF report and resolves a Buffer — used for email/scheduler delivery.
 */
export const generatePDFBuffer = (options: PDFReportOptions): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, bufferPages: true });
        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);
        buildPdfDocument(doc, options);
        doc.end();
    });
};

// ─── Excel helpers ────────────────────────────────────────────

/**
 * Generates an Excel workbook and sends it as an HTTP response attachment.
 */
export const generateExcelReport = (
    res: Response,
    filename: string,
    sheets: ExcelSheetDef[]
) => {
    const buf = buildExcelBuffer(sheets);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
};

/**
 * Generates an Excel workbook and returns it as a Buffer — used for scheduler delivery.
 */
export const generateExcelBuffer = (sheets: ExcelSheetDef[]): Buffer => {
    return buildExcelBuffer(sheets);
};

/**
 * Internal: builds an XLSX workbook buffer from sheet definitions.
 */
function buildExcelBuffer(sheets: ExcelSheetDef[]): Buffer {
    const wb = XLSX.utils.book_new();
    sheets.forEach((sheet) => {
        const ws = XLSX.utils.json_to_sheet(sheet.data);
        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
    });
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
