import type { RecordModel } from "pocketbase";
import { useSyncExternalStore } from "react";
import { getCurrentUser, isAuthenticated, pb } from "#/lib/pocketbase";

export type AuthState = {
	isAuthenticated: boolean;
	user: RecordModel | null;
};

export type AuthContext = {
	getState: () => AuthState;
	login: (identity: string, password: string) => Promise<RecordModel>;
	register: (
		email: string,
		password: string,
		passwordConfirm: string,
		name?: string,
	) => Promise<RecordModel>;
	logout: () => void;
	subscribe: (callback: () => void) => () => void;
	refresh: () => Promise<void>;
};

function readState(): AuthState {
	return {
		isAuthenticated: isAuthenticated(),
		user: getCurrentUser(),
	};
}

export function createAuthContext(): AuthContext {
	let state = readState();
	const listeners = new Set<() => void>();

	const emit = () => {
		const nextState = readState();

		if (
			nextState.isAuthenticated === state.isAuthenticated &&
			nextState.user?.id === state.user?.id &&
			nextState.user?.updated === state.user?.updated
		) {
			return;
		}

		state = nextState;

		for (const listener of listeners) {
			listener();
		}
	};

	pb.authStore.onChange(() => {
		emit();
	}, false);

	return {
		getState() {
			return state;
		},
		async login(identity, password) {
			const authResponse = await pb
				.collection("users")
				.authWithPassword(identity, password);

			emit();

			return authResponse.record;
		},
		async register(email, password, passwordConfirm, name) {
			const userData: Record<string, unknown> = {
				email,
				password,
				passwordConfirm,
				role: "member",
				isActive: true,
			};

			if (name) {
				userData.name = name;
			}

			const record = await pb.collection("users").create(userData);

			// Automatically log in the user after registration
			await pb.collection("users").authWithPassword(email, password);

			emit();

			return record;
		},
		logout() {
			pb.authStore.clear();
			emit();
		},
		async refresh() {
			if (pb.authStore.isValid) {
				try {
					await pb.collection("users").authRefresh();
				} catch {
					pb.authStore.clear();
					emit();
				}
			}
		},
		subscribe(callback) {
			listeners.add(callback);

			return () => {
				listeners.delete(callback);
			};
		},
	};
}

export function useAuth(auth: AuthContext) {
	return useSyncExternalStore(auth.subscribe, auth.getState, auth.getState);
}
