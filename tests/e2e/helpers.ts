import { Page, expect } from '@playwright/test';

/**
 * Shared E2E Helper Utilities for UniLink URMS
 */

export async function loginAs(page: Page, email: string, password = "Password123") {
  await page.goto('/login');
  
  // Wait for login card to appear
  await page.waitForSelector('h1:has-text("Welcome Back")');
  
  // Fill email and password
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  // Click sign in button
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await page.waitForURL('**/dashboard**');
  // Wait for sidebar/dashboard element to load
  await page.waitForSelector('text=Sign Out');
}

export async function clickDemoBadge(page: Page, role: "admin" | "maintenance" | "lecturer" | "student") {
  // Instead of clicking the removed demo badge, log in using credentials
  const email = `${role}@demo.lk`;
  const password = "Password123";
  await loginAs(page, email, password);
}

export async function logout(page: Page) {
  // Click Sign Out button in sidebar
  await page.click('button:has-text("Sign Out")');
  
  // Verify redirect to login
  await page.waitForURL('**/login');
  await expect(page.locator('h1:has-text("Welcome Back")')).toBeVisible();
}

/**
 * Generate unique strings to avoid test collisions
 */
export function uniqueName(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@demo.lk`;
}
