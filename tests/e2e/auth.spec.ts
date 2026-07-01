import { test, expect } from '@playwright/test';
import { loginAs, logout, clickDemoBadge } from './helpers';

test.describe('Authentication Flows', () => {
  test('Successful login and logout with Admin credentials', async ({ page }) => {
    // Navigate and login
    await loginAs(page, 'admin@demo.lk', 'Password123');
    
    // Verify dashboard url and some elements
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Logout
    await logout(page);
  });

  test('Failed login with invalid credentials shows error alert', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wronguser@demo.lk');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Verify error message is shown (handling error banner text)
    const errorAlert = page.locator('text=Incorrect email or password.').or(page.locator('text=Sign-in failed. Please try again.'));
    await expect(errorAlert.first()).toBeVisible();
  });

  test('Role Access - Admin Console', async ({ page }) => {
    await clickDemoBadge(page, 'admin');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verify admin elements are visible (like User Management in sidebar)
    await expect(page.locator('text=User Management').first()).toBeVisible();
    await logout(page);
  });

  test('Role Access - Maintenance Console', async ({ page }) => {
    await clickDemoBadge(page, 'maintenance');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verify maintenance elements (like Ticket Queue)
    await expect(page.locator('text=Ticket Queue').first()).toBeVisible();
    await logout(page);
  });
});
