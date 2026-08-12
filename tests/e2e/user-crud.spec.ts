import { test, expect } from '@playwright/test';
import { clickDemoBadge, logout, uniqueName, uniqueEmail } from './helpers';

test.describe('Admin User Directory CRUD Operations', () => {
  test('Admin can create, search, edit, and delete a member', async ({ page }) => {
    const testName = uniqueName('Jane E2E');
    const testEmail = uniqueEmail('janee2e');
    const updatedName = uniqueName('Jane E2E Updated');

    // Login as Admin
    await clickDemoBadge(page, 'admin');

    // Navigate to User Directory
    await page.goto('/admin/users');
    await page.waitForURL('**/admin/users**');

    // 1. Create User
    await page.click('button:has-text("Create Member")');

    // Fill form
    await page.fill('input[placeholder="Jane Doe"]', testName);
    await page.fill('input[placeholder="jane@university.ac.lk"]', testEmail);
    
    // Choose Role
    const roleSelect = page.locator('form select').first();
    await roleSelect.selectOption('student');
    
    // Choose Department
    const deptSelect = page.locator('form select').nth(1);
    await deptSelect.selectOption('Faculty of Computing');
    
    await page.fill('input[placeholder="Min 8 characters"]', 'Password123');

    // Click submit button inside the modal
    await page.click('form button[type="submit"]');

    // Wait for success banner
    await expect(page.locator('text=User created successfully!')).toBeVisible();

    // 2. Search User
    await page.fill('input[placeholder="Search by name or email..."]', testName);
    await expect(page.locator(`td:has-text("${testName}")`)).toBeVisible();

    // 3. Edit User
    // Click edit action on the row
    await page.click('button[title="Edit user details"]');
    // Clear and refill name
    await page.fill('input[placeholder="Jane Doe"]', updatedName);
    await page.click('button:has-text("Save Changes")');

    // Wait for success banner
    await expect(page.locator('text=User updated successfully!')).toBeVisible();

    // Search updated user
    await page.fill('input[placeholder="Search by name or email..."]', updatedName);
    await expect(page.locator(`td:has-text("${updatedName}")`)).toBeVisible();

    // 4. Delete User
    // Click delete button
    await page.click('button[title="Delete user"]');
    // Wait for delete modal confirmation
    await page.click('button:has-text("Delete")');

    // Wait for success banner
    await expect(page.locator('text=User deleted successfully!')).toBeVisible();

    // Verify it is gone
    await page.fill('input[placeholder="Search by name or email..."]', updatedName);
    await expect(page.locator('text=No members found')).toBeVisible();

    await logout(page);
  });
});
