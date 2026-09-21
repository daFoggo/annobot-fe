import { IconAlertCircle, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useForm } from "@tanstack/react-form";
import * as React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/error";
import { useSignUpMutation } from "../queries";
import { SignUpInputSchema } from "../schemas";

export interface SignUpFormProps {
	onSuccess?: () => void;
}

const getFieldError = (err: unknown): string => {
	if (!err) return "";
	if (typeof err === "string") return err;
	if (typeof err === "object" && "message" in err) {
		return String((err as { message?: unknown }).message ?? "");
	}
	return String(err);
};

export const SignUpForm = ({ onSuccess }: SignUpFormProps) => {
	const signUpMutation = useSignUpMutation();
	const [serverError, setServerError] = React.useState<string | null>(null);
	const [showPassword, setShowPassword] = React.useState(false);

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
		validators: {
			onSubmit: SignUpInputSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			try {
				await signUpMutation.mutateAsync(value);
				onSuccess?.();
			} catch (err) {
				setServerError(
					getErrorMessage(
						err,
						"Sign up failed. Please check your details and try again.",
					),
				);
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="flex flex-col gap-4"
		>
			{serverError && (
				<Alert variant="destructive">
					<IconAlertCircle />
					<AlertDescription>{serverError}</AlertDescription>
				</Alert>
			)}

			<form.Field
				name="name"
				validators={{
					onBlur: ({ value }) => {
						const result = SignUpInputSchema.shape.name.safeParse(value);
						return result.success ? undefined : result.error.issues[0]?.message;
					},
				}}
			>
				{(field) => {
					const errorMsg = getFieldError(field.state.meta.errors[0]);
					return (
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={field.name}>Name</Label>
							<Input
								id={field.name}
								name={field.name}
								type="text"
								autoComplete="name"
								placeholder="Your name"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								disabled={signUpMutation.isPending}
								aria-invalid={field.state.meta.errors.length > 0}
							/>
							{errorMsg && (
								<p className="text-xs font-medium text-destructive">
									{errorMsg}
								</p>
							)}
						</div>
					);
				}}
			</form.Field>

			<form.Field
				name="email"
				validators={{
					onBlur: ({ value }) => {
						const result = SignUpInputSchema.shape.email.safeParse(value);
						return result.success ? undefined : result.error.issues[0]?.message;
					},
				}}
			>
				{(field) => {
					const errorMsg = getFieldError(field.state.meta.errors[0]);
					return (
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={field.name}>Email</Label>
							<Input
								id={field.name}
								name={field.name}
								type="email"
								autoComplete="email"
								placeholder="you@example.com"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								disabled={signUpMutation.isPending}
								aria-invalid={field.state.meta.errors.length > 0}
							/>
							{errorMsg && (
								<p className="text-xs font-medium text-destructive">
									{errorMsg}
								</p>
							)}
						</div>
					);
				}}
			</form.Field>

			<form.Field
				name="password"
				validators={{
					onBlur: ({ value }) => {
						const result = SignUpInputSchema.shape.password.safeParse(value);
						return result.success ? undefined : result.error.issues[0]?.message;
					},
				}}
			>
				{(field) => {
					const errorMsg = getFieldError(field.state.meta.errors[0]);
					return (
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={field.name}>Password</Label>
							<InputGroup>
								<InputGroupInput
									id={field.name}
									name={field.name}
									type={showPassword ? "text" : "password"}
									autoComplete="new-password"
									placeholder="••••••••"
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									disabled={signUpMutation.isPending}
									aria-invalid={field.state.meta.errors.length > 0}
								/>
								<InputGroupAddon align="inline-end">
									<InputGroupButton
										size="icon-xs"
										aria-label={
											showPassword ? "Hide password" : "Show password"
										}
										onClick={() => setShowPassword((prev) => !prev)}
									>
										{showPassword ? <IconEyeOff /> : <IconEye />}
									</InputGroupButton>
								</InputGroupAddon>
							</InputGroup>
							{errorMsg ? (
								<p className="text-xs font-medium text-destructive">
									{errorMsg}
								</p>
							) : (
								<p className="text-xs text-muted-foreground">
									At least 6 characters
								</p>
							)}
						</div>
					);
				}}
			</form.Field>

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
			>
				{([canSubmit, isSubmitting]) => (
					<Button
						type="submit"
						size="lg"
						className="mt-2 w-full"
						disabled={!canSubmit || signUpMutation.isPending || isSubmitting}
					>
						{signUpMutation.isPending || isSubmitting ? (
							<>
								<Spinner className="mr-2" />
								Creating account...
							</>
						) : (
							"Create account"
						)}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
};
