import { invoke as TAURI_INVOKE } from "@tauri-apps/api/core";
import * as TAURI_API_EVENT from "@tauri-apps/api/event";
import type { WebviewWindow as __WebviewWindow__ } from "@tauri-apps/api/webviewWindow";

export type Result<T, E> =
	| { status: "ok"; data: T }
	| { status: "error"; error: E };

export type AppError = { message: string };

export async function wrapInvoke<T>(
	name: string,
	args?: Record<string, unknown>
): Promise<Result<T, AppError>> {
	try {
		const result = args
			? await TAURI_INVOKE(name, args)
			: await TAURI_INVOKE(name);
		return { status: "ok", data: result as T };
	} catch (e) {
		if (e instanceof Error) throw e;
		return { status: "error", error: e as AppError };
	}
}

export function __makeEvents__<T extends Record<string, unknown>>(
	mappings: Record<keyof T, string>
) {
	return new Proxy(
		{} as unknown as {
			[K in keyof T]: unknown;
		},
		{
			get: (_, event) => {
				const name = mappings[event as keyof T];
				return new Proxy((() => {}) as object, {
					apply: (_, __, [window]: [__WebviewWindow__]) => ({
						listen: (arg: (event: TAURI_API_EVENT.Event<unknown>) => void) =>
							window.listen(name, arg),
						once: (arg: (event: TAURI_API_EVENT.Event<unknown>) => void) =>
							window.once(name, arg),
						emit: (arg: unknown) => window.emit(name, arg)
					}),
					get: (_, command: string) => {
						switch (command) {
							case "listen":
								return (arg: (event: TAURI_API_EVENT.Event<unknown>) => void) =>
									TAURI_API_EVENT.listen(name, arg);
							case "once":
								return (arg: (event: TAURI_API_EVENT.Event<unknown>) => void) =>
									TAURI_API_EVENT.once(name, arg);
							case "emit":
								return (arg: unknown) => TAURI_API_EVENT.emit(name, arg);
						}
					}
				});
			}
		}
	);
}
