import { QueryClient } from "@tanstack/react-query";

export function createAppQueryClient() {
	return new QueryClient({
		defaultOptions: {
			mutations: {
				retry: false,
			},
			queries: {
				gcTime: 30 * 60 * 1000,
				refetchOnReconnect: true,
				refetchOnWindowFocus: false,
				retry: false,
				staleTime: 0,
			},
		},
	});
}
