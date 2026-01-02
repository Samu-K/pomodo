import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { commands } from "../../funcs/commands";
import { useProjectStore } from "../project";
import { useUIStore } from "../ui";

vi.mock("../../funcs/commands", () => ({
	commands: {
		projectsGetProjects: vi.fn(),
		projectsAddProject: vi.fn(),
		projectsUpdateProject: vi.fn(),
		projectsDeleteProject: vi.fn()
	}
}));

describe("Projects Store", () => {
	beforeEach(() => {
		setActivePinia(createPinia());
		vi.clearAllMocks();
	});

	it("initializes with empty projects array", () => {
		const store = useProjectStore();
		expect(store.projects).toEqual([]);
	});

	it("fetches projects from database", async () => {
		const store = useProjectStore();
		const mockProjects = [
			{
				id: 1,
				name: "Project 1",
				description: "Desc 1",
				color: "blue",
				estimated_pomodoros: 1,
				category_id: null,
				is_completed: false,
				created_at: null
			}
		];
		vi.mocked(commands.projectsGetProjects).mockResolvedValue({
			status: "ok",
			data: mockProjects
		});

		await store.fetchProjects();

		expect(commands.projectsGetProjects).toHaveBeenCalled();
		expect(store.projects).toEqual(mockProjects);
	});

	it("handles fetch error gracefully", async () => {
		const store = useProjectStore();
		const uiStore = useUIStore();
		vi.mocked(commands.projectsGetProjects).mockResolvedValue({
			status: "error",
			error: { message: "Fetch failed" }
		});

		await store.fetchProjects();

		expect(uiStore.errorMessage).toBe("Fetch failed");
	});

	it("adds a project and refreshes list", async () => {
		const store = useProjectStore();
		const newProject = {
			id: 0,
			name: "New Project",
			description: "",
			color: "pomodo-orange",
			estimated_pomodoros: 2,
			category_id: null,
			is_completed: false,
			created_at: null
		};

		vi.mocked(commands.projectsAddProject).mockResolvedValue({
			status: "ok",
			data: 123
		});
		vi.mocked(commands.projectsGetProjects).mockResolvedValue({
			status: "ok",
			data: [{ ...newProject, id: 123 }]
		});

		await store.addProject(newProject);

		expect(commands.projectsAddProject).toHaveBeenCalledWith(newProject);
		expect(commands.projectsGetProjects).toHaveBeenCalled();
		expect(store.projects.length).toBe(1);
		expect(store.projects[0].id).toBe(123);
	});

	it("updates a project and refreshes list", async () => {
		const store = useProjectStore();
		const project = {
			id: 1,
			name: "Updated Name",
			description: "",
			color: "blue",
			estimated_pomodoros: 1,
			category_id: null,
			is_completed: false,
			created_at: null
		};

		vi.mocked(commands.projectsUpdateProject).mockResolvedValue({
			status: "ok",
			data: null
		});
		vi.mocked(commands.projectsGetProjects).mockResolvedValue({
			status: "ok",
			data: [project]
		});

		await store.updateProject(project);

		expect(commands.projectsUpdateProject).toHaveBeenCalledWith(project);
		expect(store.projects[0].name).toBe("Updated Name");
	});

	it("deletes a project and refreshes list", async () => {
		const store = useProjectStore();

		vi.mocked(commands.projectsDeleteProject).mockResolvedValue({
			status: "ok",
			data: null
		});
		vi.mocked(commands.projectsGetProjects).mockResolvedValue({
			status: "ok",
			data: []
		});

		await store.deleteProject(1);

		expect(commands.projectsDeleteProject).toHaveBeenCalledWith(1);
		expect(store.projects).toEqual([]);
	});
});
