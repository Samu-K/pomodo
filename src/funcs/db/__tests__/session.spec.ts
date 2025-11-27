import { invoke } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "@/defines/session";
import {
	add_session,
	clear_all_sessions,
	delete_latest_session,
	delete_session,
	get_sessions,
	set_newest_session_complete
} from "../session";

// Mock the invoke function from tauri
vi.mock("@tauri-apps/api/core", () => ({
	invoke: vi.fn()
}));

describe("Session DB Functions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("add_session calls invoke with correct arguments", async () => {
		const mockSession: Session = {
			id: null,
			start_time: "2023-01-01T00:00:00Z",
			duration: 1500,
			finished: false,
			category_id: 1,
			notes: "Test session",
			created_at: null,
			last_modified: null
		};

		vi.mocked(invoke).mockResolvedValue(1); // Assuming it returns the new ID

		const result = await add_session(mockSession);

		expect(invoke).toHaveBeenCalledWith("session_add_session", {
			session: mockSession
		});
		expect(result).toBe(1);
	});

	it("add_session throws error on failure", async () => {
		const mockSession: Session = {
			id: null,
			start_time: "2023-01-01T00:00:00Z",
			duration: 1500,
			finished: false,
			category_id: 1,
			notes: "Test session",
			created_at: null,
			last_modified: null
		};
		vi.mocked(invoke).mockRejectedValue(new Error("DB Error"));

		await expect(add_session(mockSession)).rejects.toThrow("DB Error");
	});

	it("get_sessions returns sessions when they exist", async () => {
		const mockSessions: Session[] = [
			{
				id: 1,
				start_time: "2023-01-01T00:00:00Z",
				duration: 1500,
				finished: true,
				category_id: 1,
				notes: "Test session",
				created_at: "2023-01-01T00:00:00Z",
				last_modified: "2023-01-01T00:00:00Z"
			}
		];

		vi.mocked(invoke).mockResolvedValue(mockSessions);

		const result = await get_sessions();

		expect(invoke).toHaveBeenCalledWith("session_get_sessions");
		expect(result).toEqual(mockSessions);
	});

	it("get_sessions returns empty array when no sessions found", async () => {
		vi.mocked(invoke).mockResolvedValue([]);

		const result = await get_sessions();

		expect(result).toEqual([]);
	});

	it("get_sessions throws error on failure", async () => {
		vi.mocked(invoke).mockRejectedValue(new Error("DB Error"));

		await expect(get_sessions()).rejects.toThrow("DB Error");
	});

	it("delete_session calls invoke with correct arguments", async () => {
		const sessionId = 123;
		vi.mocked(invoke).mockResolvedValue(undefined);

		await delete_session(sessionId);

		expect(invoke).toHaveBeenCalledWith("session_delete_session", {
			sessionId: sessionId
		});
	});

	it("delete_session throws error on failure", async () => {
		const sessionId = 123;
		vi.mocked(invoke).mockRejectedValue(new Error("DB Error"));

		await expect(delete_session(sessionId)).rejects.toThrow("DB Error");
	});

	it("delete_latest_session deletes the last session", async () => {
		const mockSessions: Session[] = [
			{ id: 1 } as Session,
			{ id: 2 } as Session
		];
		vi.mocked(invoke).mockResolvedValueOnce(mockSessions); // get_sessions
		vi.mocked(invoke).mockResolvedValueOnce(undefined); // delete_session

		await delete_latest_session();

		expect(invoke).toHaveBeenCalledWith("session_get_sessions");
		expect(invoke).toHaveBeenCalledWith("session_delete_session", {
			sessionId: 2
		});
	});

	it("delete_latest_session does nothing if no sessions", async () => {
		vi.mocked(invoke).mockResolvedValueOnce([]); // get_sessions

		await delete_latest_session();

		expect(invoke).toHaveBeenCalledWith("session_get_sessions");
		expect(invoke).not.toHaveBeenCalledWith(
			"session_delete_session",
			expect.anything()
		);
	});

	it("set_newest_session_complete marks last session as complete", async () => {
		const mockSessions: Session[] = [
			{ id: 1 } as Session,
			{ id: 2 } as Session
		];
		vi.mocked(invoke).mockResolvedValueOnce(mockSessions); // get_sessions
		vi.mocked(invoke).mockResolvedValueOnce(undefined); // set_complete

		await set_newest_session_complete();

		expect(invoke).toHaveBeenCalledWith("session_get_sessions");
		expect(invoke).toHaveBeenCalledWith("session_set_session_complete", {
			id: 2
		});
	});

	it("clear_all_sessions deletes all sessions", async () => {
		const mockSessions: Session[] = [
			{ id: 1 } as Session,
			{ id: 2 } as Session
		];
		vi.mocked(invoke).mockResolvedValueOnce(mockSessions); // get_sessions
		vi.mocked(invoke).mockResolvedValue(undefined); // delete_session

		await clear_all_sessions();

		expect(invoke).toHaveBeenCalledWith("session_get_sessions");
		expect(invoke).toHaveBeenCalledWith("session_delete_session", {
			sessionId: 1
		});
		expect(invoke).toHaveBeenCalledWith("session_delete_session", {
			sessionId: 2
		});
	});
});
