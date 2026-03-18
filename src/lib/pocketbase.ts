import PocketBase from "pocketbase";

const DEFAULT_POCKETBASE_URL = "http://127.0.0.1:8090";

export const pocketbaseUrl =
	import.meta.env.VITE_POCKETBASE_URL ?? DEFAULT_POCKETBASE_URL;

export const pb = new PocketBase(pocketbaseUrl);

export function getCurrentUser() {
	return pb.authStore.record;
}

export function isAuthenticated() {
	return pb.authStore.isValid;
}
