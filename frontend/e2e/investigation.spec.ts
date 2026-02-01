import { test, expect } from '@playwright/test';

/**
 * Forensic Golden Path E2E Test
 * Simulates an analyst workflow from start to case seal
 */
test.describe('Forensic Investigation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication if necessary or use session state
    await page.goto('/');
  });

  test('should complete a full investigation cycle', async ({ page }) => {
    // 1. Verify landing page
    await expect(page.locator('h1')).toContainText('MISSION CONTROL');

    // 2. Start Investigation
    await page.click('button:has-text("Start Investigation")');
    await page.fill('input[placeholder*="Title"]', 'E2E Automated Audit - 001');
    await page.click('button:has-text("Initialize Protocol")');

    // 3. Verify Active Investigation state
    await expect(page.locator('div')).toContainText('E2E Automated Audit - 001');

    // 4. Test Undo/Redo (Temporal State)
    await page.click('button[title="Undo"]');
    // ... verify undo state ...
    await page.click('button[title="Redo"]');

    // 5. Seal Case (Finality)
    await page.click('button:has-text("Seal Case")');
    await expect(page.locator('div')).toContainText('CASE SEALED');
    
    // 6. Verify PDF generation trigger
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Download Report")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.pdf');
  });
});
