// @vitest-environment jsdom

import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { RichTextEditorImpl } from "./enhanced-editor";

afterEach(() => {
	cleanup();
});

beforeAll(() => {
	vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
		window.setTimeout(callback, 0),
	);
	vi.stubGlobal("cancelAnimationFrame", (id: number) =>
		window.clearTimeout(id),
	);
	vi.stubGlobal("PointerEvent", MouseEvent);
	vi.stubGlobal("scrollBy", vi.fn());
	vi.stubGlobal(
		"ResizeObserver",
		class ResizeObserver {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);

	HTMLElement.prototype.scrollIntoView = vi.fn();

	const rect = {
		bottom: 32,
		height: 32,
		left: 0,
		right: 160,
		top: 0,
		width: 160,
		x: 0,
		y: 0,
		toJSON: () => ({}),
	};

	Range.prototype.getBoundingClientRect = vi.fn(() => rect);
	Range.prototype.getClientRects = vi.fn(
		() =>
			({
				item: () => null,
				length: 0,
				[Symbol.iterator]: function* () {},
			}) as DOMRectList,
	);
	HTMLElement.prototype.getBoundingClientRect = vi.fn(() => rect);
});

describe("RichTextEditorImpl", () => {
	it("opens dropdown tool groups and applies heading formatting", async () => {
		const handleChange = vi.fn();

		render(
			<RichTextEditorImpl
				placeholder="Describe el proyecto"
				value=""
				onChange={handleChange}
			/>,
		);

		const headingTrigger = await screen.findByTitle("Encabezado");
		fireEvent.pointerDown(headingTrigger, { button: 0, ctrlKey: false });

		const headingOption = await screen.findByText("H1");
		fireEvent.click(headingOption);

		await waitFor(() => {
			expect(headingTrigger.getAttribute("data-variant")).toBe("secondary");
		});
	});

	it("opens the insertion menu", async () => {
		render(
			<RichTextEditorImpl
				placeholder="Describe el proyecto"
				value=""
				onChange={() => {}}
			/>,
		);

		const insertTrigger = await screen.findByTitle("Insertar");
		fireEvent.pointerDown(insertTrigger, { button: 0, ctrlKey: false });

		await screen.findByText("Nota destacada");
		await screen.findByText("Divididor");
		await screen.findByText("Línea horizontal");
	});
});
