import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { createAuthContext } from "#/lib/auth";
import { getRouter } from "#/router";

const auth = createAuthContext();
const router = getRouter(auth);

const rootElement = document.getElementById("app");
if (!rootElement) {
	throw new Error("Root element not found");
}

if (!rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(<RouterProvider router={router} context={{ auth }} />);
}
