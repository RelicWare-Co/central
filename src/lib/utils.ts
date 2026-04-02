import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getErrorMessage(error: unknown): string {
	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof error.message === "string"
	) {
		return error.message;
	}

	return "An unexpected error occurred. Please try again.";
}

export function getUserLabel(user?: {
	email?: string;
	name?: string;
	username?: string;
}): string {
	if (!user) {
		return "Unassigned";
	}

	return user.name || user.email || user.username || "Assigned";
}

export function isUnauthorizedError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		error.status === 401
	);
}

export function isNotFoundError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"status" in error &&
		error.status === 404
	);
}
