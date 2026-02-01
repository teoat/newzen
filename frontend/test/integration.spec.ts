/**
 * Integration Tests - Playwright
 * Tests for critical user flows
 */

import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'validpassword123');
    await page.click('[data-testid="login-button"]');
    
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email"]', 'invalid@example.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Ingest Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'validpassword123');
    await page.click('[data-testid="login-button"]');
    await page.goto('/ingestion');
  });

  test('should upload CSV file successfully', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('test/fixtures/sample-data.csv');
    
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });
  });

  test('should validate required columns', async ({ page }) => {
    await page.goto('/ingestion');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('test/fixtures/invalid-data.csv');
    
    await expect(page.locator('[data-testid="column-error"]')).toContainText('Missing required columns');
  });

  test('should display column mapping suggestions', async ({ page }) => {
    await page.goto('/ingestion');
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('[data-testid="upload-button"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles('test/fixtures/sample-data.csv');
    
    await expect(page.locator('[data-testid="mapping-suggestion"]').first()).toBeVisible();
  });
});

test.describe('Reconciliation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'validpassword123');
    await page.click('[data-testid="login-button"]');
    await page.goto('/reconciliation');
  });

  test('should display reconciliation dashboard', async ({ page }) => {
    await expect(page.locator('[data-testid="reconciliation-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="transaction-table"]')).toBeVisible();
  });

  test('should filter transactions by status', async ({ page }) => {
    await page.click('[data-testid="filter-dropdown"]');
    await page.click('[data-testid="filter-matched"]');
    
    await expect(page.locator('[data-testid="transaction-row"]').first()).toHaveAttribute('data-status', 'matched');
  });

  test('should show discrepancy details on click', async ({ page }) => {
    await page.click('[data-testid="discrepancy-row"]');
    
    await expect(page.locator('[data-testid="discrepancy-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="discrepancy-amount"]')).toBeVisible();
  });
});

test.describe('Project Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'validpassword123');
    await page.click('[data-testid="login-button"]');
  });

  test('should create new project', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="create-project-button"]');
    
    await page.fill('[data-testid="project-name"]', 'Test Project');
    await page.fill('[data-testid="project-description"]', 'Test Description');
    await page.click('[data-testid="save-project-button"]');
    
    await expect(page.locator('[data-testid="project-created-success"]')).toBeVisible();
    await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+/);
  });

  test('should validate required fields', async ({ page }) => {
    await page.goto('/projects');
    await page.click('[data-testid="create-project-button"]');
    await page.click('[data-testid="save-project-button"]');
    
    await expect(page.locator('[data-testid="name-error"]')).toContainText('Name is required');
  });
});

test.describe('Investigation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'validpassword123');
    await page.click('[data-testid="login-button"]');
    await page.goto('/forensic/theory-board');
  });

  test('should start investigation', async ({ page }) => {
    await page.click('[data-testid="start-investigation-button"]');
    
    await page.fill('[data-testid="investigation-title"]', 'Test Investigation');
    await page.click('[data-testid="begin-investigation-button"]');
    
    await expect(page.locator('[data-testid="investigation-panel"]')).toBeVisible();
  });

  test('should add evidence to investigation', async ({ page }) => {
    await page.click('[data-testid="evidence-item"]');
    await page.click('[data-testid="add-to-investigation"]');
    
    await expect(page.locator('[data-testid="evidence-added-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="investigation-evidence-count"]')).toContainText('1');
  });

  test('should generate dossier at end of investigation', async ({ page }) => {
    await page.click('[data-testid="complete-investigation"]');
    await page.click('[data-testid="generate-dossier"]');
    
    await expect(page.locator('[data-testid="dossier-download"]')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Accessibility', () => {
  test('should have proper focus management', async ({ page }) => {
    await page.goto('/login');
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="password"]')).toBeFocused();
  });

  test('should have skip link', async ({ page }) => {
    await page.goto('/dashboard');
    
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a:has-text("Skip to main content")');
    await expect(skipLink).toBeVisible();
  });
});
