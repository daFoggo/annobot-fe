import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	getMeFn,
	refreshSessionFn,
	signInFn,
	signOutFn,
	signUpFn,
	updateProfileFn,
} from "./functions";
import type {
	AuthUser,
	LoginInput,
	ProfileUpdateInput,
	SignUpInput,
} from "./schemas";

export const authKeys = {
	all: ["auth"] as const,
	me: () => [...authKeys.all, "me"] as const,
};

/**
 * Query options lấy thông tin user hiện tại.
 * Gọi server function `getMeFn` (đọc session cookie, gọi `/users/me` qua ky).
 * - Không có access token trong session → trả `null` (chưa đăng nhập).
 */
export const getMeQueryOptions = () =>
	queryOptions({
		queryKey: authKeys.me(),
		queryFn: (): Promise<AuthUser | null> => getMeFn(),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

/**
 * Mutation Hook đăng nhập (`POST /auth/sign-in` qua server function).
 * Server lưu tokens vào session cookie, rồi cache user vào `authKeys.me()`.
 */
export const useLoginMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: LoginInput) => signInFn({ data: input }),
		onSuccess: async (data) => {
			queryClient.setQueryData(authKeys.me(), data.user_info);
			await queryClient.invalidateQueries({ queryKey: authKeys.me() });
		},
	});
};

/**
 * Mutation Hook đăng ký (`POST /auth/sign-up`).
 * Backend KHÔNG tự cấp token sau sign-up — user phải sign in.
 */
export const useSignUpMutation = () =>
	useMutation({
		mutationFn: (input: SignUpInput) => signUpFn({ data: input }),
	});

/**
 * Mutation Hook refresh token (`POST /auth/refresh`).
 */
export const useRefreshTokensMutation = () =>
	useMutation({
		mutationFn: async () => refreshSessionFn(),
	});

/**
 * Mutation Hook cập nhật profile (`PATCH /users/me/profile`).
 */
export const useUpdateProfileMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: ProfileUpdateInput) => updateProfileFn({ data: input }),
		onSuccess: async (data) => {
			queryClient.setQueryData(authKeys.me(), data);
			await queryClient.invalidateQueries({ queryKey: authKeys.me() });
		},
	});
};

/**
 * Mutation Hook đăng xuất — xóa session cookie và clear cache.
 */
export const useLogoutMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => signOutFn(),
		onSuccess: async () => {
			queryClient.setQueryData(authKeys.me(), null);
			queryClient.clear();
			await queryClient.invalidateQueries({ queryKey: authKeys.me() });
		},
	});
};
