import { test, expect } from '@playwright/test';
import { clickDemoBadge, logout, uniqueName } from './helpers';

test.describe('Resource Management CRUD Operations', () => {
  test('Admin can create, toggle status, search, and delete a resource', async ({ page }) => {
    const resName = uniqueName('E2E Resource Lab');

    // Login as Admin
    await clickDemoBadge(page, 'admin');

    // Navigate to Resources
    await page.goto('/resources');
    await page.waitForURL('**/resources**');

    // 1. Create Resource
    await page.click('#add-resource-btn');
    await page.waitForSelector('text=Add New Resource');

    // Fill form
    await page.fill('input[name="name"]', resName);
    await page.selectOption('select[name="type"]', 'Labs');
    await page.fill('input[name="capacity"]', '50');
    await page.fill('input[name="location"]', 'Engineering Block');

    // Submit form
    await page.click('button:has-text("Save Resource")');

    // 2. Search Resource
    await page.fill('input[placeholder="Search resources…"]', resName);
    await expect(page.locator(`td:has-text("${resName}")`)).toBeVisible();

    // 3. Toggle Status
    // Locating status badge inside the row of our created resource
    const statusBtn = page.locator(`tr:has-text("${resName}") button[title="Click to toggle status"]`);
    await expect(statusBtn).toBeVisible();
    await statusBtn.click();
    
    // Check that status transitions
    // Standard sequence: Available -> Booked -> Maintenance
    // Let's verify it changed from its initial state (Available) to Booked
    await expect(page.locator(`tr:has-text("${resName}")`).locator('text=Booked')).toBeVisible();

    // 4. Delete Resource
    // Handle the window confirm popup automatically
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // Click delete
    await page.click(`tr:has-text("${resName}") button[title="Delete"]`);

    // Verify it is deleted from list
    await page.fill('input[placeholder="Search resources…"]', resName);
    await expect(page.locator('text=No resources found')).toBeVisible();

    await logout(page);
  });
});
