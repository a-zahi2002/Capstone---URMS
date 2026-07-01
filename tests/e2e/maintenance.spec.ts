import { test, expect } from '@playwright/test';
import { clickDemoBadge, logout, uniqueName } from './helpers';

test.describe('Maintenance Management End-to-End Workflow', () => {
  test('Maintenance life cycle: Log request, assign technician, start and complete work', async ({ page }) => {
    const issueText = uniqueName('AC leaking and flickering in lab');

    // ── STEP 1: Log Repair Request as Student ──
    await clickDemoBadge(page, 'student');
    await page.goto('/maintenance/request');
    await page.waitForURL('**/maintenance/request');

    // Select Physics Lab from resources list
    await page.selectOption('select[name="resource"]', { label: 'Physics Lab (Science Block) - Available' });
    await page.fill('textarea[name="description"]', issueText);
    await page.selectOption('select[name="priority"]', 'High');

    // Submit request
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Request Submitted!')).toBeVisible();
    await logout(page);

    // ── STEP 2: Assign Task as Admin Dispatcher ──
    await clickDemoBadge(page, 'admin');
    await page.goto('/maintenance/assign');
    await page.waitForURL('**/maintenance/assign');

    // Select the request we just logged
    const requestOption = page.locator('select[name="requestId"] option').filter({ hasText: issueText.slice(0, 30) });
    const requestVal = await requestOption.getAttribute('value');
    if (requestVal) {
      await page.selectOption('select[name="requestId"]', requestVal);
    }
    
    // Select technician (Demo Maintenance)
    const staffOption = page.locator('select[name="staffId"] option').filter({ hasText: 'Demo Maintenance' });
    const staffVal = await staffOption.getAttribute('value');
    if (staffVal) {
      await page.selectOption('select[name="staffId"]', staffVal);
    }
    await page.fill('textarea[name="notes"]', 'Urgent fix needed for class.');

    // Assign
    await page.click('button:has-text("Assign Task")');
    await expect(page.locator('text=Task Assigned Successfully')).toBeVisible();
    await logout(page);

    // ── STEP 3: Complete Work as Maintenance Tech ──
    await clickDemoBadge(page, 'maintenance');
    await page.goto('/maintenance');
    await page.waitForURL('**/maintenance');

    // Locate our task in the Active Ticket Queue
    const taskRow = page.locator(`.divide-y >> text=${issueText}`);
    await expect(taskRow).toBeVisible();

    // The task was assigned, so its status is already IN_PROGRESS.
    // Locate the Complete button next to our task title
    const row = page.locator('tr').filter({ hasText: issueText });
    const completeBtn = row.locator('button:has-text("Complete")');
    await expect(completeBtn).toBeVisible();

    // Complete the task
    await completeBtn.click();

    // Specify outcome in modal (Fixed (Available))
    await page.waitForSelector('text=Select Maintenance Outcome');
    await page.click('label:has-text("Fixed (Available)")');
    await page.click('button:has-text("Confirm & Complete")');

    // Verify task is marked completed and done
    await page.waitForSelector('text=Select Maintenance Outcome', { state: 'detached' });
    await expect(row.locator('text=Completed')).toBeVisible();
    await expect(row.locator('text=Done')).toBeVisible();

    // ── STEP 4: Confirm Resource Status in Catalog ──
    await page.goto('/resources');
    // Search Physics Lab
    await page.fill('input[placeholder="Search resources…"]', 'Physics Lab');
    // Confirm status is Available
    await expect(page.locator('tr:has-text("Physics Lab")').locator('text=Available')).toBeVisible();

    await logout(page);
  });
});
