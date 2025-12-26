import type { Page } from '@playwright/test';

/**
 * Mocking Tauri IPC for E2E tests in standard browser.
 */
export async function mockTauri(page: Page) {
    await page.addInitScript(() => {
        const mockSettings = [
            { id: 1, key: 'Focus Duration', value: '0.1', description: 'Focus duration', category_id: 1, data_type: 'number' },
            { id: 2, key: 'Short Break Time', value: '0.1', description: 'Short break duration', category_id: 1, data_type: 'number' },
            { id: 3, key: 'Long Break Time', value: '0.2', description: 'Long break duration', category_id: 1, data_type: 'number' },
            { id: 4, key: 'Long Break Interval', value: '2', description: 'Long break interval', category_id: 1, data_type: 'number' },
            { id: 5, key: 'Auto Start Break', value: 'false', description: 'Auto start break', category_id: 1, data_type: 'boolean' },
            { id: 6, key: 'Auto Start Focus', value: 'false', description: 'Auto start focus', category_id: 1, data_type: 'boolean' },
            { id: 7, key: 'Theme', value: 'dark', description: 'Color theme', category_id: 1, data_type: 'string' },
            { id: 8, key: 'Push notifications', value: 'false', description: 'Push notifications', category_id: 1, data_type: 'boolean' },
            { id: 9, key: 'Sound Alerts', value: 'false', description: 'Sound Alerts', category_id: 1, data_type: 'boolean' },
            { id: 10, key: 'Vibration', value: 'false', description: 'Vibration', category_id: 1, data_type: 'boolean' },
        ];

        const mockCategories = [
            { id: 1, name: 'Work', color: '#FF6B35' },
            { id: 2, name: 'Exercise', color: '#4CAF50' },
        ];

        (window as any).__TAURI_INTERNALS__ = {
            invoke: async (cmd: string, args: any) => {
                console.log(`[Tauri Mock] Invoked command: ${cmd}`, args);

                if (cmd === 'tasks_get_tasks') {
                    const stored = localStorage.getItem('mockTasks');
                    const tasks = stored ? JSON.parse(stored) : [];
                    return tasks.map((t: any) => ({ ...t, startTime: new Date(t.startTime) }));
                }

                if (cmd === 'tasks_add_task') {
                    const stored = localStorage.getItem('mockTasks');
                    const tasks = stored ? JSON.parse(stored) : [];
                    const newTask = {
                        ...args.task,
                        id: Math.floor(Math.random() * 1000000),
                        category: mockCategories.find((c: any) => c.id === args.task.category_id)?.name || '',
                        startTime: args.task.startTime || new Date().toISOString()
                    };
                    tasks.push(newTask);
                    localStorage.setItem('mockTasks', JSON.stringify(tasks));
                    return newTask.id;
                }

                const mockResponses: Record<string, any> = {
                    'settings_get_all_settings': mockSettings,
                    'settings_get_setting_categories': [{ id: 1, name: 'General' }],
                    'categories_get_categories': mockCategories,
                    'session_get_sessions': [],
                    'update_tray': null,
                    'settings_set_setting_value': null,
                    'session_add_session': 123,
                    'session_set_session_complete': null,
                    'session_delete_session': null,
                };

                if (cmd in mockResponses) {
                    return mockResponses[cmd];
                }

                return null;
            },
            metadata: {
                package: { version: '0.1.0' },
                app: { name: 'pomodo' }
            }
        };

        (window as any).__TAURI__ = {
            invoke: (window as any).__TAURI_INTERNALS__.invoke
        };
    });
}
