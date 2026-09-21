import { IconHome, IconRotate, IconTriangle } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AppLogo } from "../app-logo";

export const ErrorFallback = ({ reset }: { reset: () => void }) => {
	return (
		<div className="flex h-dvh flex-col p-6">
			<AppLogo />
			<main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
				<p className="font-mono text-6xl font-bold text-foreground">500</p>
				<p className="text-xl text-muted-foreground">
					Something went wrong on our end.
				</p>
				<div className="flex gap-2">
					<Button onClick={() => reset()} variant="outline">
						Try again
						<IconRotate data-icon="inline-end" />
					</Button>
					<Button render={<Link to="/" />} nativeButton={false}>
						Go back home
						<IconHome data-icon="inline-end" />
					</Button>
				</div>
			</main>
		</div>
	);
};

export const NestedErrorFallback = ({
	reset,
	error,
}: {
	reset: () => void;
	error?: unknown;
}) => {
	return (
		<div className="flex h-full min-h-80 w-full flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
			<div className="rounded-full bg-destructive/10 p-3 text-destructive shadow-inner">
				<IconTriangle className="size-8" />
			</div>
			<div className="mx-auto flex max-w-md flex-col gap-2">
				<h3 className="text-lg font-semibold tracking-tight text-foreground">
					Failed to load section
				</h3>
				<p className="text-sm leading-relaxed text-muted-foreground">
					{error instanceof Error
						? error.message
						: "An unexpected error occurred while rendering this view."}
				</p>
			</div>
			<Button
				onClick={() => reset()}
				variant="outline"
				size="sm"
				className="mt-2 shadow-sm transition-all hover:shadow-md"
			>
				<IconRotate data-icon="inline-start" />
				Try reloading section
			</Button>
		</div>
	);
};
