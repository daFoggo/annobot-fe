import { createServerFn } from "@tanstack/react-start";
import { requestLoggerMiddleware } from "@/lib/middleware";
import {
	LoginInputSchema,
	ProfileUpdateInputSchema,
	SignUpInputSchema,
} from "./schemas";
import { getMe, refreshToken, signIn, signUp, updateProfile } from "./server";

export const signInFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(LoginInputSchema)
	.handler(async ({ data }) => {
		const { useAppSession } = await import("@/lib/session.server");
		const response = await signIn(data);
		const session = await useAppSession();
		await session.update({
			access_token: response.access_token,
			refresh_token: response.refresh_token,
		});
		return response;
	});

export const signUpFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(SignUpInputSchema)
	.handler(async ({ data }) => {
		const { useAppSession } = await import("@/lib/session.server");
		const response = await signUp(data);
		const session = await useAppSession();
		await session.clear();
		return response;
	});

export const signOutFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.handler(async () => {
		const { useAppSession } = await import("@/lib/session.server");
		const session = await useAppSession();
		await session.clear();
	});

export const refreshSessionFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.handler(async () => {
		const { useAppSession } = await import("@/lib/session.server");
		const session = await useAppSession();

		const currentRefreshToken = session.data.refresh_token;
		if (!currentRefreshToken) {
			throw new Error("Missing refresh token in session");
		}

		const response = await refreshToken({
			refresh_token: currentRefreshToken,
		});

		await session.update({
			access_token: response.access_token,
			refresh_token: response.refresh_token,
		});

		return response;
	});

export const getMeFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.handler(async () => {
		const { useAppSession } = await import("@/lib/session.server");
		const session = await useAppSession();

		if (!session.data.access_token) {
			return null;
		}

		return getMe();
	});

export const updateProfileFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(ProfileUpdateInputSchema)
	.handler(async ({ data }) => {
		const { useAppSession } = await import("@/lib/session.server");
		const session = await useAppSession();

		if (!session.data.access_token) {
			throw new Error("Not authenticated");
		}

		return updateProfile(data);
	});
