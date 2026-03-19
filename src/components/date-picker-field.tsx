"use client";

import { CalendarDotsIcon, XIcon } from "@phosphor-icons/react";
import {
	addDays,
	format,
	parseISO,
	startOfMonth,
	startOfToday,
} from "date-fns";
import { type KeyboardEvent, useEffect, useId, useState } from "react";
import { Button } from "#/components/ui/button";
import { Calendar } from "#/components/ui/calendar";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "#/components/ui/input-group";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
} from "#/components/ui/popover";
import { Separator } from "#/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "#/components/ui/toggle-group";
import { formatDateInputValue, formatDateLabel } from "#/lib/formatting";

type DatePreset = {
	label: string;
	offsetDays: number;
	value: string;
};

type DatePickerFieldProps = {
	disabled?: boolean;
	id: string;
	label: string;
	name: string;
	placeholder?: string;
	value: string;
	onChange: (value: string) => void;
};

const DEFAULT_PRESETS = [
	{ label: "Today", offsetDays: 0 },
	{ label: "Tomorrow", offsetDays: 1 },
	{ label: "In 3 days", offsetDays: 3 },
	{ label: "In a week", offsetDays: 7 },
	{ label: "In 2 weeks", offsetDays: 14 },
] satisfies Array<Pick<DatePreset, "label" | "offsetDays">>;

export function DatePickerField({
	disabled = false,
	id,
	label,
	name,
	placeholder = "Pick a date",
	value,
	onChange,
}: DatePickerFieldProps) {
	const popoverId = useId();
	const normalizedValue = formatDateInputValue(value);
	const selectedDate = normalizedValue ? parseISO(normalizedValue) : undefined;
	const [currentMonth, setCurrentMonth] = useState<Date>(() =>
		startOfMonth(selectedDate ?? startOfToday()),
	);
	const [open, setOpen] = useState(false);
	const presets = getPresets();
	const selectedPreset = getSelectedPreset(presets, value);

	useEffect(() => {
		if (!normalizedValue) {
			return;
		}

		setCurrentMonth(startOfMonth(parseISO(normalizedValue)));
	}, [normalizedValue]);

	function handleDateSelect(date?: Date) {
		if (!date) {
			return;
		}

		onChange(format(date, "yyyy-MM-dd"));
		setCurrentMonth(startOfMonth(date));
		setOpen(false);
	}

	function handlePresetChange(nextValue: string) {
		if (!nextValue) {
			return;
		}

		const nextPreset = presets.find((preset) => preset.value === nextValue);

		if (!nextPreset) {
			return;
		}

		onChange(nextPreset.value);
		setCurrentMonth(startOfMonth(parseISO(nextPreset.value)));
		setOpen(false);
	}

	function handleClear() {
		onChange("");
		setOpen(false);
	}

	function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (
			event.key !== "Enter" &&
			event.key !== " " &&
			event.key !== "ArrowDown"
		) {
			return;
		}

		event.preventDefault();
		setOpen(true);
	}

	return (
		<>
			<input name={name} readOnly type="hidden" value={value} />
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverAnchor asChild>
					<InputGroup className="h-10">
						<InputGroupInput
							aria-controls={popoverId}
							aria-expanded={open}
							aria-haspopup="dialog"
							disabled={disabled}
							id={id}
							placeholder={placeholder}
							readOnly
							value={selectedDate ? formatDateLabel(value, "") : ""}
							onClick={() => {
								if (!disabled) {
									setOpen(true);
								}
							}}
							onKeyDown={handleInputKeyDown}
						/>
						<InputGroupAddon align="inline-end">
							{value ? (
								<InputGroupButton
									aria-label={`Clear ${label.toLowerCase()}`}
									disabled={disabled}
									size="icon-xs"
									type="button"
									variant="ghost"
									onClick={handleClear}
								>
									<XIcon />
								</InputGroupButton>
							) : null}
							<PopoverTrigger asChild>
								<InputGroupButton
									aria-label={`Open ${label.toLowerCase()} calendar`}
									disabled={disabled}
									size="icon-xs"
									type="button"
									variant="ghost"
								>
									<CalendarDotsIcon />
								</InputGroupButton>
							</PopoverTrigger>
						</InputGroupAddon>
					</InputGroup>
				</PopoverAnchor>

				<PopoverContent
					align="start"
					className="w-[min(20rem,calc(100vw-2rem))]"
					id={popoverId}
				>
					<Calendar
						fixedWeeks
						mode="single"
						month={currentMonth}
						selected={selectedDate}
						className="mx-auto p-0 [--cell-size:--spacing(9)]"
						onMonthChange={setCurrentMonth}
						onSelect={handleDateSelect}
					/>

					<Separator />

					<div className="flex flex-col gap-3">
						<ToggleGroup
							className="w-full flex-wrap"
							size="sm"
							spacing={2}
							type="single"
							value={selectedPreset}
							variant="outline"
							onValueChange={handlePresetChange}
						>
							{presets.map((preset) => (
								<ToggleGroupItem key={preset.value} value={preset.value}>
									{preset.label}
								</ToggleGroupItem>
							))}
						</ToggleGroup>

						{value ? (
							<Button
								size="sm"
								type="button"
								variant="outline"
								onClick={handleClear}
							>
								Clear Date
							</Button>
						) : null}
					</div>
				</PopoverContent>
			</Popover>
		</>
	);
}

function getPresets() {
	const today = startOfToday();

	return DEFAULT_PRESETS.map((preset) => {
		const date = addDays(today, preset.offsetDays);

		return {
			...preset,
			value: format(date, "yyyy-MM-dd"),
		} satisfies DatePreset;
	});
}

function getSelectedPreset(presets: DatePreset[], value: string) {
	return presets.find((preset) => preset.value === value)?.value ?? "";
}
