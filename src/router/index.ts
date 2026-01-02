import {
	createRouter,
	createWebHistory,
	type RouteRecordRaw
} from "vue-router";
import TimerScreen from "../pages/landing/TimerScreen.vue";
import ProjectListScreen from "../pages/projects/ProjectListScreen.vue";
import SettingsScreen from "../pages/settings/SettingsScreen.vue";
import SessionLog from "../pages/stats/SessionLog.vue";
import StatsScreen from "../pages/stats/StatsScreen.vue";
import TaskListScreen from "../pages/tasks/TaskListScreen.vue";
import TimelineScreen from "../pages/timeline/TimelineScreen.vue";

const routes: Array<RouteRecordRaw> = [
	{
		path: "/",
		name: "Timer",
		component: TimerScreen
	},
	{
		path: "/timeline",
		name: "Timeline",
		component: TimelineScreen
	},
	{
		path: "/tasks",
		name: "Tasks",
		component: TaskListScreen
	},
	{
		path: "/projects",
		name: "Projects",
		component: ProjectListScreen
	},
	{
		path: "/stats",
		name: "Stats",
		component: StatsScreen
	},
	{
		path: "/stats/log",
		name: "SessionLog",
		component: SessionLog
	},
	{
		path: "/settings",
		name: "Settings",
		component: SettingsScreen
	}
];

const router = createRouter({
	history: createWebHistory(),
	routes
});

export default router;
