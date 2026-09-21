import { IconCircleCheck } from "@tabler/icons-react";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getMeQueryOptions, SignUpForm } from "@/features/auth";

const SignUpPage = () => {
	const [created, setCreated] = useState(false);

	if (created) {
		return (
			<>
				<div className="mb-10">
					<h1 className="mt-8 mb-2 text-2xl font-medium lg:text-3xl">
						Account created
					</h1>
					<h2 className="text-sm text-muted-foreground">
						Your account is ready — sign in to continue.
					</h2>
				</div>
				<div className="flex flex-col gap-4">
					<Alert>
						<IconCircleCheck />
						<AlertTitle>Success</AlertTitle>
						<AlertDescription>
							Your account has been created. Sign in to get started.
						</AlertDescription>
					</Alert>
					<Button
						render={<Link to="/auth/sign-in" />}
						nativeButton={false}
						size="lg"
						className="w-full"
					>
						Go to sign in
					</Button>
				</div>
			</>
		);
	}

	return (
		<>
			<div className="mb-10">
				<h1 className="mt-8 mb-2 text-2xl font-medium lg:text-3xl">
					Create your account
				</h1>
				<h2 className="text-sm text-muted-foreground">
					Start working with AnnoBot in minutes.
				</h2>
			</div>
			<SignUpForm onSuccess={() => setCreated(true)} />
			<p className="mt-6 text-center text-sm text-muted-foreground">
				Already have an account?{" "}
				<Link
					to="/auth/sign-in"
					className="font-medium underline underline-offset-4 hover:text-foreground"
				>
					Sign in
				</Link>
			</p>
		</>
	);
};

export const Route = createFileRoute("/auth/sign-up")({
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.query(getMeQueryOptions());
		if (user) throw redirect({ to: "/dashboard" });
	},
	component: SignUpPage,
});
