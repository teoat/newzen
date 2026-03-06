import { test, expect } from '@playwright/test';

test.describe('Forensic Hospital Workflow (TanStack Query Validation)', () => {
  test.beforeEach(async ({ page }) => {
    // 0. Listen to logs from the browser
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // 1. Mock Clerk & Manual Auth to bypass ProjectGate & Login
    await page.addInitScript(() => {
      // Set E2E Flag FIRST
      localStorage.setItem('zenith_e2e_bypass', 'true');
      localStorage.setItem('activeProjectId', 'test-project-id');
      localStorage.setItem('zenith_projects', JSON.stringify([{
        id: 'test-project-id',
        name: 'Test Mission',
        contractor_name: 'Test Contractor'
      }]));
      localStorage.setItem('zenith_access_token', 'mock-token');

      // Mock Clerk
      (window as any).Clerk = {
        isLoaded: true,
        user: { id: 'user_123', fullName: 'Test User' },
        session: { getToken: async () => 'mock-token' },
      };
      
      // Mock AuthService.isAuthenticated
      (window as any).AuthService = {
        isAuthenticated: () => true,
        getToken: () => 'mock-token',
      };
    });

    // 2. Intercept API for Ingestion Hospital
    await page.route('**/api/v1/ingestion/hospital/test-project-id/quarantine', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'row-1',
            project_id: 'test-project-id',
            error_message: 'Invalid Currency Format',
            error_type: 'FORMAT_ERROR',
            raw_content: 'USD 1,000.5.5',
            status: 'quarantined',
            row_index: 10,
            created_at: new Date().toISOString()
          }
        ])
      });
    });

    // 3. Intercept Ignore Action
    await page.route('**/api/v1/ingestion/hospital/test-project-id/ignore/row-1', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      }
    });

    await page.goto('/forensic/hospital');
  });

  test('should display quarantined patients and handle ignore action', async ({ page }) => {
    // Debugging: check current URL and content
    console.log('Current URL:', page.url());
    await page.screenshot({ path: 'failure-hospital.png' });
    
    // Verify Initial State
    await expect(page.locator('h3')).toContainText('Patients in Triage', { timeout: 10000 });
    await expect(page.locator('span:has-text("1 TOTAL")')).toBeVisible();
    await expect(page.locator('h4')).toContainText('Invalid Currency Format');

    // Trigger Action
    const ignoreButton = page.locator('button:has-text("Ignore")');
    await ignoreButton.click();

    // Verify Optimistic/Pending State (TanStack Query handles this)
    await expect(ignoreButton).toContainText('Processing...');

    // Mock the REFRESH call after mutation to return empty (to prove invalidation worked)
    await page.route('**/api/v1/ingestion/hospital/test-project-id/quarantine', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    });

    // Wait for success toast and UI update
    await expect(page.locator('text=Row Ignored')).toBeVisible();
    await expect(page.locator('span:has-text("0 TOTAL")')).toBeVisible();
    await expect(page.locator('h4:has-text("Ward Empty")')).toBeVisible();
  });
});
