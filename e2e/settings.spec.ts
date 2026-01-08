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
});
