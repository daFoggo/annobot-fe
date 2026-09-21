import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as functions from "./functions";
import {
	authKeys,
	getMeQueryOptions,
	useLoginMutation,
	useLogoutMutation,
	useRefreshTokensMutation,
	useSignUpMutation,
	useUpdateProfileMutation,
} from "./queries";

vi.mock("./functions", () => ({
	signInFn: vi.fn(),
	signUpFn: vi.fn(),
	signOutFn: vi.fn(),
	refreshSessionFn: vi.fn(),
	getMeFn: vi.fn(),
	updateProfileFn: vi.fn(),
}));

const mockedFunctions = vi.mocked(functions);

const userInfo = {
	id: "user-1",
	name: "Jane Doe",
	email: "jane@example.com",
	timezone: "Asia/Ho_Chi_Minh",
	profile_completed: true,
};

const signInResponse = {
	access_token: "access-1",
	expiration: "2026-09-20T10:00:00Z",
	refresh_token: "refresh-1",
	refresh_expiration: "2026-09-27T10:00:00Z",
	user_info: userInfo,
};

const tokenResponse = {
	access_token: "access-2",
	expiration: "2026-09-20T10:00:00Z",
	refresh_token: "refresh-2",
	refresh_expiration: "2026-09-27T10:00:00Z",
};

const wrapper = ({ children }: { children: ReactNode }) => {
	const client = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
		},
	});
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe("auth queries & mutations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getMeQueryOptions", () => {
		it("resolves user when server function returns a user", async () => {
			mockedFunctions.getMeFn.mockResolvedValue(userInfo);

			const options = getMeQueryOptions();
			const user = await options.queryFn?.({} as never);

			expect(user).toEqual(userInfo);
			expect(mockedFunctions.getMeFn).toHaveBeenCalled();
		});

		it("resolves null when server function returns null (not signed in)", async () => {
			mockedFunctions.getMeFn.mockResolvedValue(null);

			const options = getMeQueryOptions();
			const user = await options.queryFn?.({} as never);

			expect(user).toBeNull();
		});
	});

	describe("useLoginMutation", () => {
		it("calls signInFn and writes user_info to cache", async () => {
			mockedFunctions.signInFn.mockResolvedValue(signInResponse);

			const { result } = renderHook(() => useLoginMutation(), { wrapper });

			await act(async () => {
				await result.current.mutateAsync({
					email: "jane@example.com",
					password: "secret123",
				});
			});

			expect(mockedFunctions.signInFn).toHaveBeenCalledWith({
				data: { email: "jane@example.com", password: "secret123" },
			});
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});

		it("propagates error when signInFn throws", async () => {
			mockedFunctions.signInFn.mockRejectedValue(
				new Error("Incorrect password."),
			);

			const { result } = renderHook(() => useLoginMutation(), { wrapper });

			await expect(
				act(async () => {
					await result.current.mutateAsync({
						email: "jane@example.com",
						password: "wrong-password",
					});
				}),
			).rejects.toThrow("Incorrect password.");
		});
	});

	describe("useSignUpMutation", () => {
		it("calls signUpFn with sign-up input", async () => {
			mockedFunctions.signUpFn.mockResolvedValue(userInfo);

			const { result } = renderHook(() => useSignUpMutation(), { wrapper });

			await act(async () => {
				await result.current.mutateAsync({
					email: "jane@example.com",
					password: "secret123",
					name: "Jane Doe",
				});
			});

			expect(mockedFunctions.signUpFn).toHaveBeenCalledWith({
				data: {
					email: "jane@example.com",
					password: "secret123",
					name: "Jane Doe",
				},
			});
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});
	});

	describe("useRefreshTokensMutation", () => {
		it("calls refreshSessionFn", async () => {
			mockedFunctions.refreshSessionFn.mockResolvedValue(tokenResponse);

			const { result } = renderHook(() => useRefreshTokensMutation(), {
				wrapper,
			});

			await act(async () => {
				await result.current.mutateAsync();
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});
	});

	describe("useUpdateProfileMutation", () => {
		it("calls updateProfileFn and writes updated user to cache", async () => {
			const updatedUser = { ...userInfo, name: "Jane Doe Updated" };
			mockedFunctions.updateProfileFn.mockResolvedValue(updatedUser);

			const client = new QueryClient({
				defaultOptions: { queries: { retry: false } },
			});

			const { result } = renderHook(() => useUpdateProfileMutation(), {
				wrapper: ({ children }) => (
					<QueryClientProvider client={client}>{children}</QueryClientProvider>
				),
			});

			await act(async () => {
				await result.current.mutateAsync({ name: "Jane Doe Updated" });
			});

			await waitFor(() => {
				expect(client.getQueryData(authKeys.me())).toEqual(updatedUser);
			});
		});
	});

	describe("useLogoutMutation", () => {
		it("calls signOutFn and clears the query cache", async () => {
			mockedFunctions.signOutFn.mockResolvedValue(undefined);

			const client = new QueryClient({
				defaultOptions: { queries: { retry: false } },
			});
			client.setQueryData(authKeys.me(), userInfo);

			const { result } = renderHook(() => useLogoutMutation(), {
				wrapper: ({ children }) => (
					<QueryClientProvider client={client}>{children}</QueryClientProvider>
				),
			});

			await act(async () => {
				await result.current.mutateAsync();
			});

			expect(mockedFunctions.signOutFn).toHaveBeenCalled();
			await waitFor(() => {
				expect(client.getQueryData(authKeys.me())).toBeUndefined();
			});
		});
	});
});
