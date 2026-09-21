import { z } from "zod";

/**
 * UserInfo từ anno-bot-merge backend (`GET /users/me`, `POST /auth/sign-up`).
 */
export const UserInfoSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string().email().nullable().optional(),
	avatar_url: z.string().nullable().optional(),
	created_at: z.string().nullable().optional(),
	profile_completed: z.boolean().optional(),
	timezone: z.string().optional(),
});
export type UserInfo = z.infer<typeof UserInfoSchema>;

/**
 * Alias giữ tương thích public API cũ (dùng trong UI components).
 */
export const AuthUserSchema = UserInfoSchema;
export type AuthUser = UserInfo;

/**
 * Schema cho Sign In form input (`POST /auth/sign-in`).
 */
export const LoginInputSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.max(128, "Password must be at most 128 characters"),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

/**
 * Schema cho Sign Up (`POST /auth/sign-up`).
 */
export const SignUpInputSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address"),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.max(128, "Password must be at most 128 characters"),
	name: z.string().min(1, "Name is required").max(255),
	avatar_url: z.string().max(512).nullable().optional(),
	timezone: z.string().max(64).optional(),
});
export type SignUpInput = z.infer<typeof SignUpInputSchema>;

/**
 * Token response (`POST /auth/sign-in`, `POST /auth/refresh`).
 */
export const TokenResponseSchema = z.object({
	access_token: z.string(),
	expiration: z.string(),
	refresh_token: z.string(),
	refresh_expiration: z.string(),
});
export type TokenResponse = z.infer<typeof TokenResponseSchema>;

/**
 * Sign-in response kèm user_info (`POST /auth/sign-in`).
 */
export const SignInResponseSchema = TokenResponseSchema.extend({
	user_info: UserInfoSchema,
});
export type SignInResponse = z.infer<typeof SignInResponseSchema>;

/**
 * Request body cho `POST /auth/refresh`.
 */
export const RefreshTokenRequestSchema = z.object({
	refresh_token: z.string().min(1),
});
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

/**
 * Profile update (`PATCH /users/me/profile`).
 */
export const ProfileUpdateInputSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	email: z.string().email().nullable().optional(),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.max(128, "Password must be at most 128 characters")
		.optional(),
	timezone: z.string().max(64).optional(),
});
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateInputSchema>;
