import { test, expect } from '@playwright/test';
import { mockTauri } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
    await mockTauri(page);
});

test.describe('Task Management', () => {
    test('tasks page renders correctly', async ({ page }) => {
        await page.goto('/tasks');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Task page loads
        await expect(page.getByText('Tasks')).toBeVisible();
    });

    test('should display task from mock data', async ({ page }) => {
        // Setup: Pre-create a task
        await page.addInitScript(() => {
            localStorage.setItem('mockTasks', JSON.stringify([{
                id: 1,
                title: 'Test Task',
                cycles: 4,
                completedCycles: 0,
                completed: false,
                category_id: 1
            }]));
        });

        await page.goto('/tasks');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Task should be visible
        await expect(page.getByText('Test Task')).toBeVisible();
    });

    test('task can be selected in timer', async ({ page }) => {
        // Setup: Pre-create a task
        await page.addInitScript(() => {
            localStorage.setItem('mockTasks', JSON.stringify([{
                id: 1,
                title: 'Focus Task',
                cycles: 4,
                completedCycles: 0,
                completed: false,
                category_id: 1
            }]));
        });

        await page.goto('/');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Open task selector
        await page.getByTestId('task-selector').click();
        await expect(page.getByRole('dialog')).toBeVisible();

        // Select the task
        await page.getByText('Focus Task').click();
        
        // Skip to confirm session works with task
        await page.getByTestId('skip-timer').click();
        await expect(page.getByText('REST')).toBeVisible();
    });
});
