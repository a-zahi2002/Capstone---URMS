import { test, expect } from '@playwright/test';
import { clickDemoBadge, logout } from './helpers';

test.describe('Role-Based Access Control (RBAC)', () => {
  test('Student is blocked from accessing User Directory', async ({ page }) => {
    // Login as Student
    await clickDemoBadge(page, 'student');
    
    // Attempt to navigate to User Directory
    await page.goto('/admin/users');
    
    // Verify redirection or blocked message (ProtectedRoute redirects non-admins back to dashboard)
    await page.waitForURL('**/dashboard**');
    await expect(page.locator('h1').filter({ hasText: 'Student Hub' }).or(page.locator('h1').filter({ hasText: 'Welcome' })).first()).toBeVisible();
    
    await logout(page);
  });

  test('Admin is allowed to access User Directory', async ({ page }) => {
    // Login as Admin
    await clickDemoBadge(page, 'admin');
    
    // Navigate to User Directory
    await page.goto('/admin/users');
    
    // Verify it loads the User Directory header
    await page.waitForURL('**/admin/users**');
    await expect(page.locator('h1:has-text("User Directory")')).toBeVisible();
    
    await logout(page);
  });
});
