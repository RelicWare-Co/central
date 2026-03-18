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
	logout: () => void;
	subscribe: (callback: () => void) => () => void;
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
		logout() {
			pb.authStore.clear();
			emit();
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
