import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAuthTokenForRequest = vi.fn();
const mockRefreshAuthToken = vi.fn();
const mockDeleteAuthToken = vi.fn();

vi.mock("@/lib/auth-token", () => ({
	getAuthTokenForRequest: (...args: unknown[]) =>
		mockGetAuthTokenForRequest(...args),
	refreshAuthToken: (...args: unknown[]) => mockRefreshAuthToken(...args),
	deleteAuthToken: (...args: unknown[]) => mockDeleteAuthToken(...args),
}));

const mockFetch = vi.fn();

const jsonResponse = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});

const importApi = async () => (await import("@/lib/ky")).api;

describe("ky api instance", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", mockFetch);
		mockFetch.mockReset();
		mockGetAuthTokenForRequest.mockReset().mockResolvedValue(null);
		mockRefreshAuthToken.mockReset().mockResolvedValue(null);
		mockDeleteAuthToken.mockReset().mockResolvedValue(undefined);
		window.history.replaceState({}, "", "/");
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it("attaches Bearer token from auth-token before sending", async () => {
		mockGetAuthTokenForRequest.mockResolvedValue("token-abc");
		mockFetch.mockResolvedValue(jsonResponse({ id: "u1" }));

		const api = await importApi();
		const body = await api.get("users/me").json<{ id: string }>();

		expect(body).toEqual({ id: "u1" });
		const [request] = mockFetch.mock.calls[0] as [Request];
		expect(request.url).toContain("/users/me");
		expect(request.headers.get("Authorization")).toBe("Bearer token-abc");
	});

	it("refreshes token and retries once on 401", async () => {
		mockGetAuthTokenForRequest.mockResolvedValue("token-expired");
		mockRefreshAuthToken.mockResolvedValue("token-fresh");
		mockFetch
			.mockResolvedValueOnce(jsonResponse({ detail: "Invalid token" }, 401))
			.mockResolvedValueOnce(jsonResponse({ id: "u1" }));

		const api = await importApi();
		const body = await api.get("users/me").json<{ id: string }>();

		expect(body).toEqual({ id: "u1" });
		expect(mockRefreshAuthToken).toHaveBeenCalled();
		expect(mockFetch).toHaveBeenCalledTimes(2);
		// retry request carries the fresh token + retry header
		const [retryRequest] = mockFetch.mock.calls[1] as [Request];
		expect(retryRequest.headers.get("Authorization")).toBe(
			"Bearer token-fresh",
		);
		expect(retryRequest.headers.get("x-auth-retry")).toBe("1");
	});

	it("deletes auth token and redirects to sign-in when refresh fails", async () => {
		mockGetAuthTokenForRequest.mockResolvedValue("token-expired");
		mockRefreshAuthToken.mockResolvedValue(null);
		mockFetch.mockResolvedValue(jsonResponse({ detail: "Invalid token" }, 401));

		const api = await importApi();

		await expect(api.get("users/me").json()).rejects.toThrow();
		expect(mockRefreshAuthToken).toHaveBeenCalled();
		expect(mockDeleteAuthToken).toHaveBeenCalled();
	});

	it("does not retry when already on the auth page", async () => {
		window.history.replaceState({}, "", "/auth/sign-in");
		mockGetAuthTokenForRequest.mockResolvedValue("token-expired");
		mockFetch.mockResolvedValue(jsonResponse({ detail: "Invalid token" }, 401));

		const api = await importApi();

		await expect(api.get("users/me").json()).rejects.toThrow();
		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockRefreshAuthToken).not.toHaveBeenCalled();
	});

	it("extracts backend error message from detail (non-401)", async () => {
		mockFetch.mockResolvedValue(
			jsonResponse({ detail: "Email does not exist." }, 400),
		);

		const api = await importApi();

		await expect(api.post("auth/sign-in", { json: {} }).json()).rejects.toThrow(
			"Email does not exist.",
		);
	});

	it("extracts backend error message from message field (non-401)", async () => {
		mockFetch.mockResolvedValue(
			jsonResponse(
				{ status: 400, title: "Bad Request", detail: "Invalid credentials" },
				400,
			),
		);

		const api = await importApi();

		await expect(api.post("auth/sign-in", { json: {} }).json()).rejects.toThrow(
			"Invalid credentials",
		);
	});
});
