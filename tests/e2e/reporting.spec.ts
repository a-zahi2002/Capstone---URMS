import { test, expect } from '@playwright/test';
import { clickDemoBadge, logout } from './helpers';

test.describe('Dashboard Metrics and PDF/Excel Exports', () => {
  test('Admin can view maintenance reports and download PDF and Excel files', async ({ page }) => {
    // Login as Admin
    await clickDemoBadge(page, 'admin');

    // Navigate to Maintenance Reports page
    await page.goto('/maintenance/reports');
    await page.waitForURL('**/maintenance/reports');

    // Check dashboard metric cards are loaded
    await expect(page.locator('text=Matched Records')).toBeVisible();
    await expect(page.locator('p:has-text("Pending")').first()).toBeVisible();

    // Try exporting PDF
    const pdfDownloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export PDF")');
    const pdfDownload = await pdfDownloadPromise;
    
    // Verify filename format
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
    expect(pdfDownload.suggestedFilename()).toContain('maintenance-activity-report');

    // Try exporting Excel
    const excelDownloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Excel")');
    const excelDownload = await excelDownloadPromise;

    // Verify filename format
    expect(excelDownload.suggestedFilename()).toContain('.xlsx');
    expect(excelDownload.suggestedFilename()).toContain('maintenance-activity-report');

    await logout(page);
  });
});
