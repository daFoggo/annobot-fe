import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { getMeQueryOptions, SignInForm } from "@/features/auth";

const SignInPage = () => {
	const navigate = useNavigate();
	const { redirect: redirectTo } = Route.useSearch();

	const handleSuccess = () => {
		if (redirectTo?.startsWith("/")) {
			window.location.assign(redirectTo);
			return;
		}

		navigate({ to: "/dashboard" });
	};

	return (
		<>
			<div className="mb-10">
				<h1 className="mt-8 mb-2 text-2xl font-medium lg:text-3xl">
					Welcome back
				</h1>
				<h2 className="text-sm text-muted-foreground">
					Sign in to your account
				</h2>
			</div>
			<SignInForm onSuccess={handleSuccess} />
			<p className="mt-6 text-center text-sm text-muted-foreground">
				Don&apos;t have an account?{" "}
				<Link
					to="/auth/sign-up"
					className="font-medium underline underline-offset-4 hover:text-foreground"
				>
					Sign up
				</Link>
			</p>
		</>
	);
};

export const Route = createFileRoute("/auth/sign-in")({
	validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
		redirect: typeof search.redirect === "string" ? search.redirect : undefined,
	}),
	beforeLoad: async ({ context }) => {
		const user = await context.queryClient.query(getMeQueryOptions());
		if (user) throw redirect({ to: "/dashboard" });
	},
	component: SignInPage,
});
