import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "#/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-lg border bg-clip-padding text-sm font-medium whitespace-nowrap transition-[background-color,border-color,color,box-shadow,transform] outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/30 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				default:
					"border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/70 hover:shadow-[0_4px_20px_oklch(0.76_0.2_192/0.35)]",
				outline:
					"border-border/60 bg-transparent hover:bg-accent/50 hover:border-border hover:text-foreground aria-expanded:bg-accent/50 aria-expanded:border-border aria-expanded:text-foreground",
				secondary:
					"border-border/50 bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
				destructive:
					"border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
				ghost:
					"border-transparent bg-transparent hover:bg-accent/40 hover:text-foreground aria-expanded:bg-accent/40 aria-expanded:text-foreground",
				link: "h-auto rounded-md border-transparent bg-transparent px-0 py-0 text-primary underline-offset-4 hover:underline",
			},
			size: {
				default:
					"h-9 gap-1.5 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
				xs: "h-7 gap-1 px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-11 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
				icon: "size-9",
				"icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : "button";

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
