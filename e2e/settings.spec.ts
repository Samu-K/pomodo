import { test, expect } from '@playwright/test';
import { mockTauri } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
    await mockTauri(page);
});

test.describe('Settings', () => {
    test('settings page renders timer settings', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Header is visible
        await expect(page.locator('h1').filter({ hasText: 'Settings' })).toBeVisible();
        
        // Wait for settings to load (they come from async store)
        await expect(page.getByText('Focus Duration').first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Short Break Time').first()).toBeVisible();
        await expect(page.getByText('Long Break Time').first()).toBeVisible();
        await expect(page.getByText('Long Break Time')).toBeVisible();
    });

    test('settings page renders appearance section', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Appearance section visible
        await expect(page.getByText('Appearance')).toBeVisible();
        
        // Theme selector with data-testid is visible
        await expect(page.getByTestId('theme-selector')).toBeVisible();
    });

    test('settings page renders theme customization', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Theme customization section visible
        await expect(page.getByRole('heading', { name: 'Theme Customization' })).toBeVisible();
        
        // Color options visible
        await expect(page.getByText('Primary Color')).toBeVisible();
    });

    test('timer presets can be applied and created', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Check focus duration initial value (mock is 1)
        const focusInput = page.getByTestId('setting-focus-duration').locator('input');
        await expect(focusInput).toHaveValue('1');

        // Open presets menu
        await page.getByRole('button', { name: 'Presets' }).click();
        
        // Apply Default preset
        await page.getByRole('button', { name: 'Default 25/5', exact: true }).click();
        
        // Close menu to ensure next 'Presets' click opens it
        await page.keyboard.press('Escape');

        // Check if value updated to 25
        await expect(focusInput).toHaveValue('25');

        // Change value to 40
        await focusInput.fill('40');
        await focusInput.blur();

        // Save as custom preset
        await page.getByRole('button', { name: 'Presets' }).click();
        await page.getByRole('button', { name: 'Save current as preset', exact: true }).click();
        
        await page.getByLabel('Preset Name').fill('Work Focus');
        await page.getByRole('button', { name: 'Save Preset', exact: true }).click();

        // Verify it exists in menu
        await page.getByRole('button', { name: 'Presets' }).click();
        await expect(page.getByRole('button', { name: 'Work Focus 40/5', exact: true })).toBeVisible();
    });

    test('discard changes button resets settings', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        const focusInput = page.getByTestId('setting-focus-duration').locator('input');
        await expect(focusInput).toHaveValue('1');

        // Modify a setting
        await focusInput.fill('33');
        await focusInput.blur();

        // Trash can should be visible
        const discardBtn = page.getByTitle('Discard Changes');
        await expect(discardBtn).toBeVisible();

        // Click discard
        await discardBtn.click();

        // Trash can should disappear and value reset
        await expect(discardBtn).not.toBeVisible();
        await expect(focusInput).toHaveValue('1');
    });

});
