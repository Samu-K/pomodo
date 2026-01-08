import { test, expect } from '@playwright/test';
import { mockTauri } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
    await mockTauri(page);
});

test.describe('Premium Features', () => {
    test('should show paywall for heatmap previous month and then unlock', async ({ page }) => {
        await page.goto('/stats');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // 1. Try to go to previous month in heatmap
        const prevBtn = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }).first();
        await prevBtn.click();

        // Paywall should appear
        await expect(page.getByRole('heading', { name: 'Upgrade to Premium' })).toBeVisible();
        await expect(page.getByText('Unlock the full power of Pomodo')).toBeVisible();

        // 2. Click "Unlock All Features"
        await page.getByRole('button', { name: 'Unlock All Features' }).click();

        // Paywall should disappear
        await expect(page.getByRole('heading', { name: 'Upgrade to Premium' })).not.toBeVisible();

        // 3. Try clicking prev month again - it should NOT show paywall now
        // Note: The heatmap component uses settingsStore.isPremium which is updated in memory.
        await prevBtn.click();
        await expect(page.getByRole('heading', { name: 'Upgrade to Premium' })).not.toBeVisible();
        
        // Heatmap should show previous month (the title changes)
        // Default is current month, let's just check it doesn't show paywall.
    });

    test('should show paywall when exceeding project limit (10 projects)', async ({ page }) => {
        await page.goto('/stats'); // To get to projects via nav
        await page.getByTestId('nav-timeline').click(); // Just to navigate around
        await page.getByTestId('nav-tasks').click();
        
        // Let's go to projects (likely in some sub-menu or via Task selector)
        // Actually, ProjectListScreen is /projects? Let's check router.
        await page.goto('/projects'); 
        
        // Wait for page
        await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();

        // Add 10 projects
        const addBtn = page.getByTestId('add-project-btn');
        if (await addBtn.isVisible()) {
           // If there's an add button
        } else {
            // Check for FAB or similar
        }

        // Since we are mocking, we can just pre-fill localStorage with 10 projects
        await page.evaluate(() => {
            const projects = Array.from({ length: 10 }, (_, i) => ({
                id: i + 1,
                name: `Project ${i + 1}`,
                is_completed: false
            }));
            localStorage.setItem('mockProjects', JSON.stringify(projects));
        });

        await page.reload();
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Try to add 11th project
        await page.getByTestId('add-project-btn').click();
        
        // Should show Project Limit Modal
        await expect(page.getByRole('heading', { name: 'Project Limit Reached' })).toBeVisible();
        await expect(page.getByText(/Upgrade to Premium for unlimited/)).toBeVisible();

        // Click Upgrade to Unlimited - this directly upgrades from ProjectLimitModal
        await page.getByRole('button', { name: 'Upgrade to Unlimited' }).click();
        
        // Modal should close
        await expect(page.getByRole('heading', { name: 'Project Limit Reached' })).not.toBeVisible();

        // Now try adding again - it should show the New Project dialog instead of limit modal
        await page.getByTestId('add-project-btn').click();
        await expect(page.getByText('New Project')).toBeVisible();
    });

    test('should allow theme customization for premium users', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Theme Customization section is visible but locked for non-premium
        await expect(page.getByRole('heading', { name: 'Theme Customization' })).toBeVisible();
        await expect(page.getByText('Unlock Theme Customization')).toBeVisible();

        // Click Upgrade to Premium in the lock overlay
        await page.getByRole('button', { name: 'Upgrade to Premium' }).click();
        
        // Premium modal should appear
        await expect(page.getByRole('heading', { name: 'Upgrade to Premium' })).toBeVisible();
        
        // Unlock premium
        await page.getByRole('button', { name: 'Unlock All Features' }).click();
        await expect(page.getByRole('heading', { name: 'Upgrade to Premium' })).not.toBeVisible();

        // Lock overlay should be gone (this confirms premium is active)
        await expect(page.getByText('Unlock Theme Customization')).not.toBeVisible();
        
        // Color labels should still be visible (section is now usable)
        await expect(page.getByText('Primary Color')).toBeVisible();
    });
});
