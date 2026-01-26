import { createTestingPinia } from "@pinia/testing";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCategoryStore } from "../../../stores/categories";
import { useThemeStore } from "../../../stores/theme";
import { useTimerStore } from "../../../stores/timer";
import {
	commonIconStubs,
	setupBrowserMocks,
	VDialogStub,
	vuetify
} from "../../../test/test-helpers";
import CategoryManager from "../CategoryManager.vue";

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn()
}));

// Mock Lucide Icons using shared stubs
vi.mock("lucide-vue-next", () => ({
	MinusCircle: commonIconStubs.MinusCircle,
	PlusCircle: commonIconStubs.PlusCircle
}));

// Setup browser mocks (ResizeObserver, etc.)
setupBrowserMocks();

describe("CategoryManager.vue", () => {
	let wrapper: ReturnType<typeof mount>;
	let categoryStore: ReturnType<typeof useCategoryStore>;

	beforeEach(() => {
		wrapper = mount(CategoryManager, {
			props: {
				selectedCategory: null
			},
			global: {
				plugins: [
					createTestingPinia({
						createSpy: vi.fn,
						stubActions: true
					}),
					vuetify
				],
				stubs: {
					VDialog: VDialogStub
				}
			}
		});

		categoryStore = useCategoryStore();

		// Setup initial state
		categoryStore.categories = [
			{ id: 1, name: "Work", color: "red" },
			{ id: 2, name: "Study", color: "blue" }
		];
	});

	it("renders the select category button initially", () => {
		const btn = wrapper.findComponent({ name: "VBtn" });
		expect(btn.exists()).toBe(true);
		expect(btn.text()).toContain("Select category");
	});

	it("lists categories from the store", async () => {
		// Open dialog
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");

		// Check content in wrapper (since we stubbed VDialog, it renders in place)
		expect(wrapper.text()).toContain("Work");
		expect(wrapper.text()).toContain("Study");
	});

	it("opens edit mode", async () => {
		// Open dialog
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");

		// Find Edit button
		const buttons = wrapper.findAll("button");
		const editBtn = buttons.find((b) => b.text().includes("Edit"));
		expect(editBtn?.exists()).toBe(true);

		await editBtn?.trigger("click");

		// Check if save and cancel buttons appear
		const newButtons = wrapper.findAll("button");
		const saveBtn = newButtons.find((b) => b.text().includes("Save"));
		const cancelBtn = newButtons.find((b) => b.text().includes("Cancel"));

		expect(saveBtn?.exists()).toBe(true);
		expect(cancelBtn?.exists()).toBe(true);
	});

	it("cancels edit mode", async () => {
		// Open dialog and enter edit mode
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");
		const buttons = wrapper.findAll("button");
		const editBtn = buttons.find((b) => b.text().includes("Edit"));
		await editBtn?.trigger("click");

		// Click Cancel
		const newButtons = wrapper.findAll("button");
		const cancelBtn = newButtons.find((b) => b.text().includes("Cancel"));
		await cancelBtn?.trigger("click");

		// Check if we are back to normal mode
		const finalButtons = wrapper.findAll("button");
		const editBtnAgain = finalButtons.find((b) => b.text().includes("Edit"));
		expect(editBtnAgain?.exists()).toBe(true);
	});

	it("opens add category modal", async () => {
		// Open dialog
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");

		// Find Add button (it has an icon)
		const plusIcon = wrapper.find(".lucide-plus-circle");
		expect(plusIcon.exists()).toBe(true);

		await plusIcon.trigger("click");

		// Check if modal is open.
		expect(wrapper.text()).toContain("Add category");
	});

	it("creates a new category", async () => {
		// Open dialog and add modal
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");
		const plusIcon = wrapper.find(".lucide-plus-circle");
		await plusIcon.trigger("click");

		// Fill form
		const inputs = wrapper.findAll("input");
		const nameInput = inputs[0];
		await nameInput.setValue("New Cat");

		// Click Create
		const buttons = wrapper.findAll("button");
		const createBtn = buttons.find((b) => b.text().includes("Create"));

		await createBtn?.trigger("click");

		expect(categoryStore.createCategory).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "New Cat"
			})
		);
	});

	it("saves edits", async () => {
		// Open dialog and enter edit mode
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");
		const buttons = wrapper.findAll("button");
		const editBtn = buttons.find((b) => b.text().includes("Edit"));
		await editBtn?.trigger("click");

		// Modify a category name
		const inputs = wrapper.findAll("input");
		await inputs[0].setValue("Work Updated");

		// Click Save
		const newButtons = wrapper.findAll("button");
		const saveBtn = newButtons.find((b) => b.text().includes("Save"));
		await saveBtn?.trigger("click");

		expect(categoryStore.updateCategories).toHaveBeenCalled();
		const updateCall = (
			categoryStore.updateCategories as ReturnType<typeof vi.fn>
		).mock.calls[0][0];
		expect(updateCall[0].name).toBe("Work Updated");
	});

	it("deletes a category", async () => {
		// Open dialog and enter edit mode
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");
		const buttons = wrapper.findAll("button");
		const editBtn = buttons.find((b) => b.text().includes("Edit"));
		await editBtn?.trigger("click");

		// Trigger delete on first item.
		const minusIcon = wrapper.find(".lucide-minus-circle");
		await minusIcon.trigger("click");

		// Confirm delete dialog should appear
		expect(wrapper.text()).toContain("Confirm Deletion");

		// Click Delete button
		const confirmButtons = wrapper.findAll("button");
		const deleteConfirmBtn = confirmButtons.find((b) =>
			b.text().includes("Delete")
		);
		await deleteConfirmBtn?.trigger("click");

		// Now save
		const saveButtons = wrapper.findAll("button");
		const saveBtn = saveButtons.find((b) => b.text().includes("Save"));
		await saveBtn?.trigger("click");

		expect(categoryStore.removeCategories).toHaveBeenCalled();
		const removeCall = (
			categoryStore.removeCategories as ReturnType<typeof vi.fn>
		).mock.calls[0][0];
		expect(removeCall[0].id).toBe(1);
	});

	it("handles opening edit mode when categories is null", async () => {
		// Set categories to null to test edge case
		// Intentionally testing invalid null state
		// @ts-expect-error: testing invalid state
		categoryStore.categories = null;

		// Open dialog
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");

		// Find Edit button - it should be disabled when categories is null
		const buttons = wrapper.findAll("button");
		const editBtn = buttons.find((b) => b.text().includes("Edit"));

		// The button should be disabled
		expect(editBtn?.attributes("disabled")).toBeDefined();
	});

	it("clears timer category when deleting the currently selected category", async () => {
		// Get timer store after component is mounted
		const timerStore = useTimerStore();

		// Set the timer to use category 1
		timerStore.categoryId = 1;

		// Open dialog and enter edit mode
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");
		const buttons = wrapper.findAll("button");
		const editBtn = buttons.find((b) => b.text().includes("Edit"));
		await editBtn?.trigger("click");

		// Trigger delete on first item (id: 1)
		const minusIcon = wrapper.find(".lucide-minus-circle");
		await minusIcon.trigger("click");

		// Confirm delete
		const confirmButtons = wrapper.findAll("button");
		const deleteConfirmBtn = confirmButtons.find((b) =>
			b.text().includes("Delete")
		);
		await deleteConfirmBtn?.trigger("click");

		// Save changes
		const saveButtons = wrapper.findAll("button");
		const saveBtn = saveButtons.find((b) => b.text().includes("Save"));
		await saveBtn?.trigger("click");

		// Verify that setCategoryId was called with null
		expect(timerStore.setCategoryId).toHaveBeenCalledWith(null);
	});

	it("cancels delete confirmation dialog", async () => {
		// Open dialog and enter edit mode
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");
		const buttons = wrapper.findAll("button");
		const editBtn = buttons.find((b) => b.text().includes("Edit"));
		await editBtn?.trigger("click");

		// Verify we're in edit mode with 2 inputs
		const inputsBefore = wrapper.findAll("input");
		expect(inputsBefore.length).toBe(2);

		// Trigger delete on first item
		const minusIcon = wrapper.find(".lucide-minus-circle");
		await minusIcon.trigger("click");

		// Confirm delete dialog should appear
		expect(wrapper.text()).toContain("Confirm Deletion");
		expect(wrapper.text()).toContain("Work");

		// Click Cancel on delete confirmation
		const confirmButtons = wrapper.findAll("button");
		const cancelBtn = confirmButtons.find((b) => b.text() === "Cancel");
		await cancelBtn?.trigger("click");

		// Wait for state update
		await wrapper.vm.$nextTick();

		// Save edits - no categories should be removed since we cancelled
		const saveButtons = wrapper.findAll("button");
		const saveBtn = saveButtons.find((b) => b.text().includes("Save"));
		await saveBtn?.trigger("click");

		// Verify removeCategories was not called
		expect(categoryStore.removeCategories).not.toHaveBeenCalled();
	});

	it("sets color when creating a new category", async () => {
		// Setup theme store with colors
		const themeStore = useThemeStore();
		vi.spyOn(themeStore, "categoryColors", "get").mockReturnValue([
			"#ff0000",
			"#00ff00"
		]);

		// Open dialog and add modal
		await wrapper.findComponent({ name: "VBtn" }).trigger("click");
		const plusIcon = wrapper.find(".lucide-plus-circle");
		await plusIcon.trigger("click");

		// Fill form with name
		const inputs = wrapper.findAll("input");
		const nameInput = inputs[0];
		await nameInput.setValue("New Cat");

		// The buttons are rendered in the grid. We can find them by their class.
		const colorButtons = wrapper.findAll(".rounded-full.transition-all");
		expect(colorButtons.length).toBeGreaterThan(0);

		// Click the first color button
		await colorButtons[0].trigger("click");

		// Click Create
		const buttons = wrapper.findAll("button");
		const createBtn = buttons.find((b) => b.text().includes("Create"));
		await createBtn?.trigger("click");

		expect(categoryStore.createCategory).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "New Cat",
				color: "#ff0000"
			})
		);
	});
});
