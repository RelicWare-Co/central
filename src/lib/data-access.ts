import { notFound, redirect } from "@tanstack/react-router";
import type { AuthContext } from "#/lib/auth";
import { isNotFoundError, isUnauthorizedError } from "#/lib/utils";

type RunWithAuthRedirectOptions = {
	notFoundOn404?: boolean;
};

function throwLoginRedirect(auth: AuthContext, redirectTo: string): never {
	auth.logout();

	throw redirect({
		to: "/login",
		search: {
			redirect: redirectTo,
		},
	});
}

export function requireAuthUser(auth: AuthContext, redirectTo: string) {
	const user = auth.getState().user;

	if (!user?.id) {
		throwLoginRedirect(auth, redirectTo);
	}

	return user.id;
}

export async function runWithAuthRedirect<T>(
	auth: AuthContext,
	redirectTo: string,
	operation: () => Promise<T>,
	options: RunWithAuthRedirectOptions = {},
) {
	try {
		return await operation();
	} catch (error) {
		if (isUnauthorizedError(error)) {
			throwLoginRedirect(auth, redirectTo);
		}

		if (options.notFoundOn404 && isNotFoundError(error)) {
			throw notFound();
		}

		throw error;
	}
}
