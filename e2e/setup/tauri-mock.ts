import type { Page } from '@playwright/test';

/**
 * Mocking Tauri IPC for E2E tests in standard browser.
 */
export async function mockTauri(page: Page) {
    await page.addInitScript(() => {
        (window as any)._isTest = true;
        // Initialize localStorage with defaults if empty
        const defaultSettings = [
            { id: 1, key: 'Focus Duration', value: '1', description: 'Focus duration', category_id: 1, data_type: 'number' },
            { id: 2, key: 'Short Break Time', value: '0.1', description: 'Short break duration', category_id: 1, data_type: 'number' },
            { id: 3, key: 'Long Break Time', value: '0.2', description: 'Long break duration', category_id: 1, data_type: 'number' },
            { id: 4, key: 'Long Break Interval', value: '2', description: 'Long break interval', category_id: 1, data_type: 'number' },
            { id: 5, key: 'Auto Start Break', value: 'false', description: 'Auto start break', category_id: 1, data_type: 'boolean' },
            { id: 6, key: 'Auto Start Focus', value: 'false', description: 'Auto start focus', category_id: 1, data_type: 'boolean' },
            { id: 7, key: 'Theme', value: 'dark', description: 'Color theme', category_id: 1, data_type: 'string' },
            { id: 8, key: 'Push notifications', value: 'false', description: 'Push notifications', category_id: 1, data_type: 'boolean' },
            { id: 9, key: 'Sound Alerts', value: 'false', description: 'Sound Alerts', category_id: 1, data_type: 'boolean' },
            { id: 10, key: 'Vibration', value: 'false', description: 'Vibration', category_id: 1, data_type: 'boolean' },
            { id: 11, key: 'Toggle Timer', value: 'CommandOrControl+Alt+P', description: 'Global toggle timer shortcut', category_id: 1, data_type: 'string' },
            { id: 12, key: 'Timer Presets', value: '[]', description: 'Custom timer presets stored as JSON', category_id: 1, data_type: 'string' },
        ];
        localStorage.setItem('pomodo-welcome-seen', 'true');

        const mockCategories = [
            { id: 1, name: 'Work', color: '#FF6B35' },
            { id: 2, name: 'Exercise', color: '#4CAF50' },
        ];

        if (!localStorage.getItem('mockSettings')) {
            localStorage.setItem('mockSettings', JSON.stringify(defaultSettings));
        }
        if (!localStorage.getItem('mockCategories')) {
            localStorage.setItem('mockCategories', JSON.stringify(mockCategories));
        }
        if (!localStorage.getItem('mockProjects')) {
            localStorage.setItem('mockProjects', JSON.stringify([]));
        }
        if (!localStorage.getItem('mockSessions')) {
            localStorage.setItem('mockSessions', JSON.stringify([]));
        }
        if (!localStorage.getItem('mockTasks')) {
            localStorage.setItem('mockTasks', JSON.stringify([]));
        }
        if (localStorage.getItem('mockPremium') === null) {
            localStorage.setItem('mockPremium', 'false');
        }

        (window as any)._setMockPremium = (val: boolean) => {
            localStorage.setItem('mockPremium', String(val));
        };

        (window as object as { __TAURI_INTERNALS__: object }).__TAURI_INTERNALS__ = {
            invoke: async (cmd: string, args: any) => {
                console.log(`[Tauri Mock] Invoked command: ${cmd}`, args);

                const getStored = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
                const setStored = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));

                // Settings
                if (cmd === 'settings_get_all_settings') {
                    return getStored('mockSettings');
                }
                if (cmd === 'settings_get_setting_categories') {
                    return [{ id: 1, name: 'timer' }];
                }
                if (cmd === 'settings_set_setting_value') {
                    const settings = getStored('mockSettings');
                    const idx = settings.findIndex((s: any) => s.id === args.id);
                    if (idx !== -1) {
                        settings[idx].value = String(args.value);
                        setStored('mockSettings', settings);
                    }
                    return null;
                }

                // Categories
                if (cmd === 'categories_get_categories') {
                    return getStored('mockCategories');
                }
                if (cmd === 'categories_add_category') {
                    const cats = getStored('mockCategories');
                    const newId = Math.floor(Math.random() * 1000000);
                    cats.push({ ...args.cat, id: newId });
                    setStored('mockCategories', cats);
                    return newId;
                }
                if (cmd === 'categories_delete_category') {
                    const cats = getStored('mockCategories').filter((c: any) => c.id !== args.catId);
                    setStored('mockCategories', cats);
                    return null;
                }

                // Projects
                if (cmd === 'projects_get_projects') {
                    return getStored('mockProjects');
                }
                if (cmd === 'projects_add_project') {
                    const projects = getStored('mockProjects');
                    const newId = Math.floor(Math.random() * 1000000);
                    projects.push({ ...args.project, id: newId, is_completed: false, created_at: new Date().toISOString() });
                    setStored('mockProjects', projects);
                    return newId;
                }
                if (cmd === 'projects_update_project') {
                    const projects = getStored('mockProjects');
                    const idx = projects.findIndex((p: any) => p.id === args.project.id);
                    if (idx !== -1) {
                        projects[idx] = args.project;
                        setStored('mockProjects', projects);
                    }
                    return null;
                }
                if (cmd === 'projects_delete_project') {
                    const projects = getStored('mockProjects').filter((p: any) => p.id !== args.id);
                    setStored('mockProjects', projects);
                    return null;
                }

                // Tasks
                if (cmd === 'tasks_get_tasks') {
                    return getStored('mockTasks');
                }
                if (cmd === 'tasks_add_task') {
                    const tasks = getStored('mockTasks');
                    const newId = Math.floor(Math.random() * 1000000);
                    const categories = getStored('mockCategories');
                    const newTask = {
                        ...args.task,
                        id: newId,
                        category: categories.find((c: any) => c.id === args.task.category_id)?.name || '',
                        startTime: args.task.startTime || new Date().toISOString()
                    };
                    tasks.push(newTask);
                    setStored('mockTasks', tasks);
                    return newId;
                }
                if (cmd === 'tasks_update_task') {
                    const tasks = getStored('mockTasks');
                    const idx = tasks.findIndex((t: any) => t.id === args.task.id);
                    if (idx !== -1) {
                        tasks[idx] = args.task;
                        setStored('mockTasks', tasks);
                    }
                    return null;
                }
                if (cmd === 'tasks_delete_task') {
                    const tasks = getStored('mockTasks').filter((t: any) => t.id !== args.id);
                    setStored('mockTasks', tasks);
                    return null;
                }

                // Sessions
                if (cmd === 'session_get_sessions') {
                    return getStored('mockSessions');
                }
                if (cmd === 'session_add_session') {
                    const sessions = getStored('mockSessions');
                    const newId = Math.floor(Math.random() * 1000000);
                    sessions.push({ ...args.session, id: newId, created_at: new Date().toISOString() });
                    setStored('mockSessions', sessions);
                    return newId;
                }
                if (cmd === 'session_delete_session') {
                    const sessions = getStored('mockSessions').filter((s: any) => s.id !== args.sessionId);
                    setStored('mockSessions', sessions);
                    return null;
                }
                if (cmd === 'session_set_session_complete') {
                    const sessions = getStored('mockSessions');
                    const idx = sessions.findIndex((s: any) => s.id === args.id);
                    if (idx !== -1) {
                        sessions[idx].finished = true;
                        setStored('mockSessions', sessions);
                    }
                    return null;
                }

                if (cmd === 'update_tray') return null;

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
        
        // Mock the settings store isPremium by checking localStorage
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            if (key === 'mockPremium') {
                // If we want to simulate premium change, we might need to reload or 
                // have the app poll this, but pinia is in-memory.
            }
            originalSetItem.apply(this, [key, value]);
        };
    });
}
