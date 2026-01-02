import { defineStore } from "pinia";
import { ref } from "vue";
import { commands, type Project } from "../funcs/commands";
import { useUIStore } from "./ui";

export const useProjectStore = defineStore("projects", () => {
    const projects = ref<Project[]>([]);
    const ui = useUIStore();

    async function fetchProjects() {
        try {
            const res = await commands.projectsGetProjects();
            if (res.status === "error") throw new Error(res.error.message);
            projects.value = res.data;
        } catch (e: unknown) {
            console.error("Failed to fetch projects", e);
            ui.setError(e instanceof Error ? e.message : "Failed to fetch projects");
        }
    }

    async function addProject(project: Project) {
        try {
            const res = await commands.projectsAddProject(project);
            if (res.status === "error") throw new Error(res.error.message);
            await fetchProjects();
            return res.data;
        } catch (e: unknown) {
            console.error("Error adding project", e);
            ui.setError(e instanceof Error ? e.message : "Failed to add project");
        }
    }

    async function updateProject(project: Project) {
        try {
            const res = await commands.projectsUpdateProject(project);
            if (res.status === "error") throw new Error(res.error.message);
            await fetchProjects();
        } catch (e: unknown) {
            console.error("Error updating project", e);
            ui.setError(e instanceof Error ? e.message : "Failed to update project");
        }
    }

    async function deleteProject(id: number) {
        try {
            const res = await commands.projectsDeleteProject(id);
            if (res.status === "error") throw new Error(res.error.message);
            await fetchProjects();
        } catch (e: unknown) {
            console.error("Error deleting project", e);
            ui.setError(e instanceof Error ? e.message : "Failed to delete project");
        }
    }

    return {
        projects,
        fetchProjects,
        addProject,
        updateProject,
        deleteProject
    };
});
