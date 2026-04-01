import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { createAuthContext } from "#/lib/auth";
import { createAppQueryClient } from "#/lib/query-client";
import { getRouter } from "#/router";

const auth = createAuthContext();
const queryClient = createAppQueryClient();
const router = getRouter({ auth, queryClient });

const rootElement = document.getElementById("app");
if (!rootElement) {
	throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<QueryClientProvider client={queryClient}>
			<RouterProvider router={router} context={{ auth, queryClient }} />
		</QueryClientProvider>,
	);
}
