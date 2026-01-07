import { test, expect } from '@playwright/test';
import { mockTauri } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
    await mockTauri(page);
});

test.describe('Task Management', () => {
    test('should create a recurrent task and use it in the timer', async ({ page }) => {
        // 1. Go to Tasks page
        await page.goto('/tasks');
        await expect(page.locator('.v-progress-circular')).not.toBeVisible();

        // 2. Open Create Task modal
        // We need a way to open it. In TaskListScreen there should be an "add" button.
        // Let's check TaskListScreen.vue or AppLayout.vue (FAB?)
        // AppLayout.vue has @add-task="handleAddTask" which shows CreateTaskModal.
        // It's triggered by the FAB in TaskListScreen.

        await page.getByTestId('add-task-fab').click();
        await expect(page.getByText('Create New Task')).toBeVisible();

        // 3. Fill task details
        const taskTitle = 'Daily Focus Session';
        const nameInput = page.getByTestId('task-name-input').locator('input');
        await expect(nameInput).toBeVisible();
        await nameInput.fill(taskTitle);

        // Select Category
        await page.getByTestId('task-category-select').click();
        await page.getByText('Work').click();

        // Set Recurrence to Daily
        // RecurrenceType.DAILY is 'daily'
        await page.getByTestId('task-recurrence-select').click();
        await page.getByText('daily').click();

        // 4. Create Task
        await page.getByTestId('confirm-create-task').click();

        // 5. Verify the task appears in the list
        // It might take a moment to refresh from store.
        await expect(page.getByText(taskTitle)).toBeVisible();

        // 6. Go to Timer screen
        await page.getByTestId('nav-timer').click();
        await expect(page).toHaveURL(/\//);

        // 7. Select the new task in the timer
        await page.getByTestId('task-selector').click();
        await expect(page.getByRole('dialog').getByText('Select Task')).toBeVisible();

        // The task should be there
        const taskItem = page.getByTestId('task-item').filter({ hasText: taskTitle });
        await expect(taskItem).toBeVisible();
        await taskItem.click();

        // 8. Start Focus with the task
        const toggleBtn = page.getByTestId('toggle-timer');
        await toggleBtn.click();

        // Check if timer is running and task title is displayed in TimerScreen
        await expect(page.getByText(taskTitle)).toBeVisible();
        await expect(toggleBtn).not.toBeVisible(); // Focus mode buttons hide when running

        // 9. Go to Timeline screen
        await page.getByTestId('nav-timeline').click();
        await expect(page).toHaveURL(/\/timeline/);

        // Verify task appears on "Today" in timeline
        await expect(page.getByTestId('selected-date-display')).toContainText('Today');
        await expect(page.getByTestId('timeline-task-block').filter({ hasText: taskTitle })).toBeVisible();
        await expect(page.getByTestId('stats-scheduled-count')).toHaveText('1');

        // 10. Check next day recurrence
        await page.getByTestId('next-date').click();
        await expect(page.getByTestId('selected-date-display')).not.toContainText('Today');
        // It should still have the daily task
        await expect(page.getByTestId('timeline-task-block').filter({ hasText: taskTitle })).toBeVisible();
        await expect(page.getByTestId('stats-scheduled-count')).toHaveText('1');

        // 11. Optional: Pause to cleanup/verify
        // Go back to timer for final clean view
        await page.getByTestId('nav-timer').click();
        const mainContainer = page.locator('.select-none.touch-none');
        await mainContainer.dispatchEvent('mousedown');
        await page.waitForTimeout(3500);
        await mainContainer.dispatchEvent('mouseup');
        await expect(toggleBtn).toBeVisible();
    });
});
