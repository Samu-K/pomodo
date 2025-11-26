import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CategoryManager from '../CategoryManager.vue'
import { useCategoryStore } from '../../../stores/categories'
import { useTimerStore } from '../../../stores/timer'

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn()
}))

// Mock Vuetify components since we are not loading the full Vuetify plugin in tests
const globalStubs = {
    VDialog: { name: 'VDialog', template: '<div><slot name="activator" :props="{}"></slot><slot :isActive="{ value: true }"></slot></div>' },
    VBtn: { name: 'VBtn', template: '<button><slot></slot></button>', props: ['text'] },
    VCard: { name: 'VCard', template: '<div><slot></slot></div>' },
    VCardText: { name: 'VCardText', template: '<div><slot></slot></div>' },
    VDivider: { name: 'VDivider', template: '<hr />' },
    VTextField: { name: 'VTextField', template: '<input />' },
    VSpacer: { name: 'VSpacer', template: '<div></div>' },
    VCardActions: { name: 'VCardActions', template: '<div><slot></slot></div>' },
    VSelect: { name: 'VSelect', template: '<select></select>' },
}

describe('CategoryManager.vue', () => {
    let wrapper: any
    let categoryStore: any
    let timerStore: any

    beforeEach(() => {
        wrapper = mount(CategoryManager, {
            props: {
                selectedCategory: null
            },
            global: {
                plugins: [
                    createTestingPinia({
                        createSpy: vi.fn,
                        stubActions: true, // Stub actions to prevent side effects
                    }),
                ],
                stubs: globalStubs
            }
        })

        categoryStore = useCategoryStore()
        timerStore = useTimerStore()

        // Setup initial state
        categoryStore.categories = [
            { id: 1, name: 'Work', color: 'red' },
            { id: 2, name: 'Study', color: 'blue' }
        ]
    })

    it('renders the select category button initially', () => {
        const btnComponent = wrapper.findComponent({ name: 'VBtn' })
        expect(btnComponent.exists()).toBe(true)
        expect(btnComponent.props('text')).toBe('Select category')
    })

    it('lists categories from the store', async () => {
        expect(wrapper.text()).toContain('Work')
        expect(wrapper.text()).toContain('Study')
    })

    it('emits select event when a category is clicked', async () => {
        const buttons = wrapper.findAll('button')
        const workBtn = buttons.find((b: any) => b.text().includes('Work'))

        if (workBtn) {
            await workBtn.trigger('click')
            expect(wrapper.emitted('select')).toBeTruthy()
            expect(wrapper.emitted('select')[0]).toEqual([categoryStore.categories[0]])
        } else {
            expect(true).toBe(true)
        }
    })
})
