import { test, expect } from '@playwright/test';
import { mockTauri } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
    await mockTauri(page);
});

test.describe('Basic Navigation', () => {
    test('should load the landing page and show the timer', async ({ page }) => {
        await page.goto('/');

        // Wait for the loader to disappear
        await expect(page.locator('.v-progress-circular')).not.toBeVisible({ timeout: 10000 });

        // Check if the timer is visible
        const timerText = page.locator('.text-timer');
        await expect(timerText).toBeVisible();
        await expect(page.getByText('FOCUS')).toBeVisible();
    });

    test('should navigate through all bottom tabs', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.v-progress-circular')).not.toBeVisible();

        const tabs = [
            { id: 'nav-timeline', url: /\/timeline/ },
            { id: 'nav-tasks', url: /\/tasks/ },
            { id: 'nav-stats', url: /\/stats/ },
            { id: 'nav-timer', url: /\// },
        ];

        for (const tab of tabs) {
            await page.getByTestId(tab.id).click();
            await expect(page).toHaveURL(tab.url);
            await expect(page.getByTestId(tab.id)).toHaveClass(/text-pomodo-orange/);
        }
    });

    test('should navigate to settings and back', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.v-progress-circular')).not.toBeVisible();

        // Navigate to Stats first
        await page.getByTestId('nav-stats').click();
        await expect(page).toHaveURL(/\/stats/);

        // Then navigate to Settings
        await page.getByTestId('nav-settings').click();
        await expect(page).toHaveURL(/\/settings/);
        await expect(page.getByText('Settings')).toBeVisible();

        // Back to timer
        await page.getByTestId('settings-back').click();
        await expect(page).toHaveURL(/\//);
    });
});

test.describe('Timer Functionality', () => {
    test('should select a task and start the timer', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.v-progress-circular')).not.toBeVisible();

        // 1. Select a task
        await page.getByTestId('task-selector').click();
        await expect(page.getByRole('dialog').getByText('Select Task')).toBeVisible();

        // If no tasks, click "No task" to select a category
        await page.getByRole('button', { name: 'No task' }).click();
        await expect(page.getByRole('dialog').getByText('Select category')).toBeVisible();

        // In our mock, Work category exists. Let's select it.
        await page.getByRole('button', { name: 'Work' }).first().click();

        // Wait for modal to close (it should close on selection if implemented that way, or we click close)
        // TaskManager closes on @select and we Emit handled in TimerScreen.

        // 2. Start timer
        const toggleBtn = page.getByTestId('toggle-timer');
        const initialTimeText = await page.locator('.text-timer').textContent();
        await toggleBtn.click();

        // In Focus mode, buttons disappear when running
        await expect(toggleBtn).not.toBeVisible();

        // Wait for it to tick
        await expect(async () => {
            const now = await page.locator('.text-timer').textContent();
            expect(now).not.toBe(initialTimeText);
        }).toPass({ timeout: 5000 });

        // 3. Pause timer (using Hold to Pause)
        // We need to hold the main container.
        const mainContainer = page.locator('.select-none.touch-none');
        await mainContainer.dispatchEvent('mousedown');

        // Wait for hold duration (3s in app)
        await page.waitForTimeout(3500);
        await mainContainer.dispatchEvent('mouseup');

        // Buttons should reappear
        await expect(toggleBtn).toBeVisible();

        const pausedTime = await page.locator('.text-timer').textContent();
        await page.waitForTimeout(1000);
        expect(await page.locator('.text-timer').textContent()).toBe(pausedTime);
    });

    test('should skip to rest and back', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.v-progress-circular')).not.toBeVisible();

        // Focus -> Rest
        await page.getByTestId('skip-timer').click();
        await expect(page.getByText('REST')).toBeVisible();

        // Rest -> Focus
        await page.getByTestId('skip-timer').click();
        await expect(page.getByText('FOCUS')).toBeVisible();
    });

    test('should transition to long rest after interval', async ({ page }) => {
        // Our mock has Long Break Interval = 2.
        // That means: 
        // 1. Finish Focus 1 -> Rest (Short)
        // 2. Finish Focus 2 -> Rest (Long)

        await page.goto('/');
        await expect(page.locator('.v-progress-circular')).not.toBeVisible();

        // We can simulate finishing by clicking skip twice for each "session"
        // Cycle 1
        await page.getByTestId('skip-timer').click(); // Finish Focus 1 -> Rest (Short)
        await expect(page.getByText('REST')).toBeVisible();

        await page.getByTestId('skip-timer').click(); // Finish Rest 1 -> Focus 2
        await expect(page.getByText('FOCUS')).toBeVisible();

        // Cycle 2
        await page.getByTestId('skip-timer').click(); // Finish Focus 2 -> Rest (Long)
        await expect(page.getByText('REST')).toBeVisible();

        // In long rest, the duration is longer. 
        // Short rest is 0.1 min (6s), Long rest is 0.2 min (12s).
        await expect(page.locator('.text-timer')).toHaveText(/00:12|12/);
    });
});

test.describe('Theme Switching', () => {
    test('should change theme from settings', async ({ page }) => {
        await page.goto('/settings');
        await expect(page.locator('.v-progress-circular')).not.toBeVisible();

        // Check initial state (should be dark based on mock)
        await expect(page.locator('html')).toHaveClass(/dark/);

        // Change to light
        await page.getByTestId('theme-selector').click();
        await page.getByText('Light').click();

        // In this app, we need to click "Save Changes" if there's no auto-save for theme?
        // Let's check SettingsScreen.vue: handleThemeChange calls settingsStore.setTheme(value).
        // settingsStore.setTheme calls updateSetting and applyTheme.

        await expect(page.locator('html')).not.toHaveClass(/dark/);

        // Change back to dark
        await page.getByTestId('theme-selector').click();
        await page.getByText('Dark').click();
        await expect(page.locator('html')).toHaveClass(/dark/);
    });
});
