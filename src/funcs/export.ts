import type { Category, Project, Session } from "./commands";
import { commands } from "./commands";

export async function exportUserData(format: "json" | "csv" = "json") {
	try {
		// Fetch all data in parallel
		const [sessionsRes, projectsRes, categoriesRes] = await Promise.all([
			commands.sessionGetSessions(),
			commands.projectsGetProjects(),
			commands.categoriesGetCategories()
		]);

		if (sessionsRes.status === "error") throw sessionsRes.error;
		if (projectsRes.status === "error") throw projectsRes.error;
		if (categoriesRes.status === "error") throw categoriesRes.error;

		const sessions: Session[] = sessionsRes.data;
		const projects: Project[] = projectsRes.data;
		const categories: Category[] = categoriesRes.data;

		const data = {
			sessions,
			projects,
			categories,
			exportDate: new Date().toISOString()
		};

		let content = "";
		let extension = "json";
		let filename = `pomodo-export-${new Date().toISOString().split("T")[0]}`;

		if (format === "json") {
			content = JSON.stringify(data, null, 2);
			extension = "json";
		} else {
			// CSV - Flatten sessions mainly
			const header =
				"Start Time,End Time,Duration (sec),Category,Project,Note\n";
			const rows = sessions
				.map((s) => {
					const cat =
						categories.find((c) => c.id === s.category_id)?.name ||
						"Uncategorized";
					const proj =
						projects.find((p) => p.id === s.project_id)?.name || "No Project";
					const note = (s.notes || "").replace(/,/g, " "); // simple escape, field is 'notes' not 'note'
					return `${s.start_time},${s.last_modified || ""},${s.duration || 0},${cat},${proj},${note}`;
				})
				.join("\n");
			content = header + rows;
			extension = "csv";
		}

		filename += `.${extension}`;

		// Use Tauri's native save dialog
		const { save } = await import("@tauri-apps/plugin-dialog");
		const { writeTextFile } = await import("@tauri-apps/plugin-fs");

		const filePath = await save({
			filters: [
				{
					name: format.toUpperCase(),
					extensions: [extension]
				}
			],
			defaultPath: filename
		});

		if (filePath) {
			await writeTextFile(filePath, content);
			return true;
		}

		return false;
	} catch (e) {
		console.error("Export failed", e);
		throw e;
	}
}
