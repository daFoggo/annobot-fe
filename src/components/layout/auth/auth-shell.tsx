import { Link } from "@tanstack/react-router";
import type { PropsWithChildren } from "react";
import { AppLogo } from "@/components/common/app-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const QUOTE = {
	text: "I've been using AnnoBot and it's been amazing — I set the question, the system gathers the evidence, and I decide. It's self-experimentation for my own home, not a smart building telling me how to live.",
	handle: "foggo",
};

export const AuthShell = ({ children }: PropsWithChildren) => {
	return (
		<div className="relative flex min-h-svh flex-col bg-background">
			<div className="absolute top-0 mx-auto mt-6 w-full px-8 sm:px-6 lg:px-8">
				<nav className="relative flex items-center justify-between sm:h-10">
					<div className="flex shrink-0 grow items-center lg:grow-0">
						<div className="flex w-full items-center justify-between md:w-auto">
							<Link to="/" className="flex items-center">
								<AppLogo />
							</Link>
						</div>
					</div>
				</nav>
			</div>

			<div className="flex h-full flex-1">
				<main className="flex flex-1 shrink-0 flex-col items-center border-r bg-background py-8">
					<div className="flex w-80 flex-1 flex-col justify-center sm:w-96">
						{children}
					</div>
					<div className="text-center text-balance">
						<p className="text-xs text-muted-foreground sm:mx-auto sm:max-w-sm">
							By continuing, you agree to AnnoBot&apos;s Terms of Service and
							Privacy Policy, and to receive periodic emails with updates.
						</p>
					</div>
				</main>

				<aside className="hidden flex-1 shrink basis-1/4 flex-col items-center justify-center xl:flex">
					<div className="relative flex flex-col gap-6">
						<div className="absolute -top-12 -left-10 select-none">
							<span className="text-9xl leading-none text-muted-foreground/30">
								&ldquo;
							</span>
						</div>

						<blockquote className="z-10 max-w-lg text-3xl">
							{QUOTE.text}
						</blockquote>

						<div className="flex items-center gap-4">
							<Avatar size="lg">
								<AvatarFallback>
									{QUOTE.handle.charAt(0).toUpperCase() || "U"}
								</AvatarFallback>
							</Avatar>
							<cite className="font-medium whitespace-nowrap text-muted-foreground not-italic">
								@{QUOTE.handle}
							</cite>
						</div>
					</div>
				</aside>
			</div>
		</div>
	);
};
