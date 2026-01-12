import { test, expect } from '@playwright/test';
import { mockTauri } from './setup/tauri-mock';

test.beforeEach(async ({ page }) => {
    await mockTauri(page);
});

test.describe('Projects Management', () => {
    test('should create a project', async ({ page }) => {
        await page.goto('/projects');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Create project
        await page.getByTestId('add-project-btn').click();
        await expect(page.getByText('New Project')).toBeVisible();
        
        // Fill name
        const nameInput = page.getByPlaceholder('Enter project name');
        await nameInput.fill('E2E Project');
        
        await page.getByRole('button', { name: 'Create Project' }).click();
        
        // Verify project created
        await expect(page.getByText('E2E Project')).toBeVisible();
    });

    test('should track cycles correctly', async ({ page }) => {
        // Setup: Project with focused cycles
        await page.addInitScript(() => {
            const project = { id: 1, name: 'Cycle Tracker', estimated_pomodoros: 4, color: 'pomodo-orange' };
            const session = { 
                id: 1, 
                project_id: 1, 
                duration: 1500, // 25 mins = 1 cycle
                finished: true, 
                start_time: new Date().toISOString() 
            };
            localStorage.setItem('mockProjects', JSON.stringify([project]));
            localStorage.setItem('mockSessions', JSON.stringify([session]));
            
            // Mock Focus Duration to 25 mins
            const settings = JSON.parse(localStorage.getItem('mockSettings') || '[]');
            const focusIdx = settings.findIndex((s: any) => s.key === 'Focus Duration');
            if (focusIdx !== -1) settings[focusIdx].value = '25';
            localStorage.setItem('mockSettings', JSON.stringify(settings));
        });

        await page.goto('/projects');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Check project visible
        await expect(page.getByText('Cycle Tracker')).toBeVisible();
        
        // The project UI shows focused cycles
        await expect(page.getByText('1.0')).toBeVisible();
    });

    test('projects page renders correctly', async ({ page }) => {
        await page.goto('/projects');
        await expect(page.getByTestId('initial-loader')).not.toBeVisible();

        // Header visible
        await expect(page.getByRole('heading', { name: 'Projects' })).toBeVisible();
        
        // Add button visible
        await expect(page.getByTestId('add-project-btn')).toBeVisible();
    });
});
