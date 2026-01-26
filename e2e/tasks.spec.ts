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

    test('shows overlap warning when creating task at conflicting time', async ({ page }) => {
        // Setup: Pre-create a task at current time (new tasks default to current time, causing overlap)
        const now = new Date();
        
        await page.addInitScript((dateStr) => {
            localStorage.setItem('mockTasks', JSON.stringify([{
                id: 1,
                title: 'Existing Task',
                estimated_pomodoros: 2,
                completed_pomodoros: 0,
                is_completed: false,
                category_id: 1,
                start_datetime: dateStr
            }]));
        }, now.toISOString());

        await page.goto('/tasks');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Open create task modal
        await page.getByTestId('add-task-fab').click();
        await expect(page.getByText('Create New Task')).toBeVisible();

        // Fill in task title
        await page.getByTestId('task-name-input').locator('input').fill('Overlapping Task');

        // Try to create the task
        await page.getByTestId('confirm-create-task').click();

        // Should show overlap warning modal
        await expect(page.getByText('Schedule Conflict')).toBeVisible();
        await expect(page.getByText(/overlaps with "Existing Task"/)).toBeVisible();
    });

    test('can create overlapping task after confirming warning', async ({ page }) => {
        const now = new Date();
        
        await page.addInitScript((dateStr) => {
            localStorage.setItem('mockTasks', JSON.stringify([{
                id: 1,
                title: 'Existing Task',
                estimated_pomodoros: 2,
                completed_pomodoros: 0,
                is_completed: false,
                category_id: 1,
                start_datetime: dateStr
            }]));
        }, now.toISOString());

        await page.goto('/tasks');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Create overlapping task
        await page.getByTestId('add-task-fab').click();
        await page.getByTestId('task-name-input').locator('input').fill('New Overlapping Task');
        await page.getByTestId('confirm-create-task').click();

        // Confirm despite overlap
        await expect(page.getByText('Schedule Conflict')).toBeVisible();
        await page.getByText('Create Anyway').click();

        // Task should be created and visible
        await expect(page.getByText('New Overlapping Task')).toBeVisible();
    });

    test('can cancel creating overlapping task', async ({ page }) => {
        const now = new Date();
        
        await page.addInitScript((dateStr) => {
            localStorage.setItem('mockTasks', JSON.stringify([{
                id: 1,
                title: 'Existing Task',
                estimated_pomodoros: 2,
                completed_pomodoros: 0,
                is_completed: false,
                category_id: 1,
                start_datetime: dateStr
            }]));
        }, now.toISOString());

        await page.goto('/tasks');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Try to create overlapping task
        await page.getByTestId('add-task-fab').click();
        await page.getByTestId('task-name-input').locator('input').fill('Cancelled Task');
        await page.getByTestId('confirm-create-task').click();

        // Cancel the overlap warning
        await expect(page.getByText('Schedule Conflict')).toBeVisible();
        await page.getByTestId('confirmation-secondary-btn').click();

        // Should still be in create modal
        await expect(page.getByText('Create New Task')).toBeVisible();
        await expect(page.getByText('Schedule Conflict')).not.toBeVisible();
    });
});
