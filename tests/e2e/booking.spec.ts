import { test, expect } from '@playwright/test';
import { clickDemoBadge, logout } from './helpers';

test.describe('Resource Booking and Conflict Resolution', () => {
  test('Lecturer can book resource and conflict resolution blocks double booking', async ({ page }) => {
    // Generate future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0]; // yyyy-mm-dd

    // Login as Lecturer
    await clickDemoBadge(page, 'lecturer');

    // Navigate to Bookings
    await page.goto('/bookings');
    await page.waitForURL('**/bookings**');

    // 1. Create a successful booking
    await page.click('button:has-text("New Booking")');
    await page.waitForSelector('h2:has-text("New Booking")');

    // Fill form
    await page.selectOption('select[name="faculty"]', 'Computing');
    // Wait for resources to load based on faculty
    await page.waitForTimeout(1000); 
    await page.selectOption('select[name="resourceId"]', { label: 'Lecture Hall 01 (Faculty of Computing)' });

    await page.fill('input[name="date"]', dateStr);
    await page.fill('input[name="startTime"]', '10:00');
    await page.fill('input[name="endTime"]', '12:00');
    await page.fill('textarea[name="purpose"]', 'E2E Test Class Reservation');

    // Click submit
    await page.click('button:has-text("Confirm Booking")');

    // Verify it was successful and modal closed
    await page.waitForSelector('h2:has-text("New Booking")', { state: 'detached' });

    // 2. Try to double-book the same resource and verify conflict resolution blocks it
    await page.click('button:has-text("New Booking")');
    await page.waitForSelector('h2:has-text("New Booking")');

    // Fill form with exact same details
    await page.selectOption('select[name="faculty"]', 'Computing');
    await page.waitForTimeout(1000); 
    await page.selectOption('select[name="resourceId"]', { label: 'Lecture Hall 01 (Faculty of Computing)' });

    await page.fill('input[name="date"]', dateStr);
    await page.fill('input[name="startTime"]', '10:00');
    await page.fill('input[name="endTime"]', '12:00');
    await page.fill('textarea[name="purpose"]', 'E2E Test Conflict Block Check');

    // Click submit
    await page.click('button:has-text("Confirm Booking")');

    // Verify error/conflict alert is shown in the form
    const errorBanner = page.locator('form').locator('text=conflict')
      .or(page.locator('form').locator('text=overlapping'))
      .or(page.locator('form').locator('text=Failed'));
    await expect(errorBanner.first()).toBeVisible();

    // Close modal
    await page.click('button:has-text("Cancel")');

    // 3. Clean up: Delete the created booking to keep tests idempotent
    const row = page.locator('tr').filter({ hasText: 'Lecture Hall 01' }).filter({ hasText: '10:00 - 12:00' });
    await row.locator('button').first().click();
    await page.click('button:has-text("Delete Record")');
    await page.click('button:has-text("Delete Booking")');
    await expect(row).toBeHidden();

    await logout(page);
  });
});
