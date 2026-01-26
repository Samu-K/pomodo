import { test, expect } from '@playwright/test';
import { mockTauri } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
    await mockTauri(page);
});

test.describe('Focus Sessions', () => {
    test('focus session with category', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // 1. Select Category
        await page.getByTestId('task-selector').click();
        await page.getByRole('button', { name: 'No task' }).click();
        await page.getByRole('button', { name: 'Work' }).first().click();

        // 2. Skip to complete a focus session (without running timer)
        await page.getByTestId('skip-timer').click();
        await expect(page.getByText('REST')).toBeVisible();
    });

    test('focus session with project', async ({ page }) => {
        // Setup: Project
        await page.addInitScript(() => {
            localStorage.setItem('mockProjects', JSON.stringify([{ id: 10, name: 'E2E Project', color: 'pomodo-orange' }]));
        });

        await page.goto('/');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // 1. Select Project - use task selector
        await page.getByTestId('task-selector').click();
        
        // Wait for modal to load
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Switch to PROJECTS tab
        await page.getByRole('dialog').getByRole('tab', { name: 'PROJECTS' }).click();
        
        // Find and click the project
        await page.getByText('E2E Project').click();

        // 2. Skip to complete session
        await page.getByTestId('skip-timer').click();
        await expect(page.getByText('REST')).toBeVisible();
    });

    test('focus session with task', async ({ page }) => {
        // Setup: Task
        await page.addInitScript(() => {
            localStorage.setItem('mockTasks', JSON.stringify([{ 
                id: 100, 
                title: 'E2E Task', 
                cycles: 4, 
                completedCycles: 0,
                completed: false,
                category_id: 1 
            }]));
        });

        await page.goto('/');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // 1. Select Task from selector
        await page.getByTestId('task-selector').click();
        await expect(page.getByRole('dialog')).toBeVisible();
        
        // Find and click the task
        await page.getByText('E2E Task').click();

        // 2. Skip to complete session
        await page.getByTestId('skip-timer').click();
        await expect(page.getByText('REST')).toBeVisible();
    });
});
