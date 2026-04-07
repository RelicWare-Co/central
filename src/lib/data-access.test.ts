import { describe, expect, it, vi } from "vitest";
import type { AuthContext } from "#/lib/auth";
import { requireAuthUser, runWithAuthRedirect } from "#/lib/data-access";

function createAuthContext(userId?: string) {
	const logout = vi.fn();

	const auth = {
		getState: () => ({
			isAuthenticated: Boolean(userId),
			user: userId ? { id: userId } : null,
		}),
		login: vi.fn(),
		logout,
		refresh: vi.fn(),
		register: vi.fn(),
		subscribe: vi.fn(),
	} as unknown as AuthContext;

	return { auth, logout };
}

describe("data-access helpers", () => {
	it("returns the authenticated user id", () => {
		const { auth } = createAuthContext("user_123");

		expect(requireAuthUser(auth, "/app/inbox")).toBe("user_123");
	});

	it("redirects to login when auth user is missing", () => {
		const { auth, logout } = createAuthContext();

		expect(() => requireAuthUser(auth, "/app/inbox")).toThrow();
		expect(logout).toHaveBeenCalledTimes(1);
	});

	it("maps unauthorized errors to login redirects", async () => {
		const { auth, logout } = createAuthContext("user_123");

		await expect(
			runWithAuthRedirect(auth, "/app/inbox", async () => {
				throw {
					status: 401,
				};
			}),
		).rejects.toMatchObject({
			options: {
				search: {
					redirect: "/app/inbox",
				},
				to: "/login",
			},
		});

		expect(logout).toHaveBeenCalledTimes(1);
	});

	it("maps not found errors when enabled", async () => {
		const { auth } = createAuthContext("user_123");

		await expect(
			runWithAuthRedirect(
				auth,
				"/app/tasks/1",
				async () => {
					throw {
						status: 404,
					};
				},
				{
					notFoundOn404: true,
				},
			),
		).rejects.toMatchObject({
			isNotFound: true,
		});
	});
});
