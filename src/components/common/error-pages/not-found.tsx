import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AppLogo } from "../app-logo";

export const NotFound = () => {
	return (
		<div className="flex h-dvh flex-col p-6">
			<AppLogo />
			<main className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
				<p className="font-mono text-6xl font-bold text-foreground">404</p>
				<p className="text-xl text-muted-foreground">
					Oops! The page you are looking for does not exist.
				</p>
				<Button render={<Link to="/" />} nativeButton={false}>
					Go back home
				</Button>
			</main>
		</div>
	);
};
