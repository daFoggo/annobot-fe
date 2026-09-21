import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type {
	LoginInput,
	ProfileUpdateInput,
	SignInResponse,
	SignUpInput,
	TokenResponse,
	UserInfo,
} from "./schemas";

/**
 * Gọi API đăng nhập (`POST /auth/sign-in`).
 */
export const signIn = async (params: LoginInput): Promise<SignInResponse> =>
	api.post("auth/sign-in", { json: params }).json<SignInResponse>();

/**
 * Gọi API đăng ký tài khoản mới (`POST /auth/sign-up`).
 */
export const signUp = async (params: SignUpInput): Promise<UserInfo> =>
	api.post("auth/sign-up", { json: params }).json<UserInfo>();

/**
 * Gọi API làm mới Access Token bằng Refresh Token (`POST /auth/refresh`).
 */
export const refreshToken = async (params: {
	refresh_token: string;
}): Promise<TokenResponse> =>
	api.post("auth/refresh", { json: params }).json<TokenResponse>();

/**
 * Gọi API lấy thông tin user hiện tại (`GET /users/me`).
 * Ky tự gắn Bearer token từ session; nếu không có token thì server trả 401.
 */
export const getMe = async (): Promise<UserInfo> =>
	api.get("users/me").json<UserInfo>();

/**
 * Gọi API cập nhật profile user hiện tại (`PATCH /users/me/profile`).
 */
export const updateProfile = async (
	params: ProfileUpdateInput,
): Promise<UserInfo> =>
	api.patch("users/me/profile", { json: params }).json<UserInfo>();
