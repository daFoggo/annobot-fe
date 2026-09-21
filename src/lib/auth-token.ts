import { createServerFn } from "@tanstack/react-start";

const getServerToken = createServerFn({ method: "GET" }).handler(async () => {
	const { useAppSession } = await import("./session.server");
	const session = await useAppSession();
	return session.data.access_token;
});

const clearServerSession = createServerFn({ method: "POST" }).handler(
	async () => {
		const { useAppSession } = await import("./session.server");
		const session = await useAppSession();
		await session.clear();
	},
);

/**
 * Lấy token để sử dụng cho các yêu cầu API trong src/lib/ky.ts.
 * Tự refresh nếu access token sắp hết hạn (dựa trên ACCESS_REFRESH_SKEW_MS).
 */
export const getAuthTokenForRequest = async () => {
	if (typeof window !== "undefined" && isAccessTokenNearExpiry()) {
		if (!isRefreshTokenStillValid()) {
			await deleteAuthToken();
			return null;
		}

		const refreshedToken = await refreshAuthToken({ clearOnFailure: false });
		if (refreshedToken) {
			return refreshedToken;
		}
	}

	return getAuthToken();
};

/**
 * Lấy access token từ cache (client) hoặc server session (SSR).
 */
export const getAuthToken = async () => {
	const cachedToken = getCachedToken();
	if (cachedToken !== null) {
		return cachedToken;
	}

	try {
		const token = await getServerToken();
		setCachedToken(token ?? null);
		return token ?? null;
	} catch (_error) {
		return null;
	}
};

/**
 * Refresh access token, deduplicate các lần gọi trùng qua refreshPromise.
 */
export const refreshAuthToken = async (options?: {
	clearOnFailure?: boolean;
}) => {
	const clearOnFailure = options?.clearOnFailure ?? true;

	if (refreshPromise) {
		return refreshPromise;
	}

	refreshPromise = (async () => {
		try {
			const { refreshSessionFn } = await import("@/features/auth");
			const response = await refreshSessionFn();
			setCachedToken(response.access_token);

			if (typeof window !== "undefined") {
				localStorage.setItem("expiration", response.expiration);
				localStorage.setItem("refresh_expiration", response.refresh_expiration);
			}

			return response.access_token;
		} catch (_error) {
			if (clearOnFailure) {
				await deleteAuthToken();
			}
			return null;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
};

/**
 * Xóa toàn bộ thông tin xác thực (cache, localStorage, server session).
 */
export const deleteAuthToken = async () => {
	setCachedToken(null);

	if (typeof window !== "undefined") {
		localStorage.removeItem("expiration");
		localStorage.removeItem("refresh_expiration");
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
	}

	try {
		await clearServerSession();
	} catch (error) {
		console.error("Failed to clear session on server", error);
	}
};

// --- Internal Helpers ---

let tokenCache: { value: string | null; updatedAt: number } = {
	value: null,
	updatedAt: 0,
};
let refreshPromise: Promise<string | null> | null = null;

const TOKEN_CACHE_TTL_MS = 5000;
const ACCESS_REFRESH_SKEW_MS = 2 * 60 * 1000;

const getCachedToken = () => {
	if (typeof window === "undefined") return null;
	if (Date.now() - tokenCache.updatedAt > TOKEN_CACHE_TTL_MS) return null;
	return tokenCache.value;
};

const setCachedToken = (token: string | null) => {
	tokenCache = {
		value: token,
		updatedAt: Date.now(),
	};
};

const parseExpirationMs = (rawValue: string | null): number | null => {
	if (!rawValue) return null;

	const parsed = Date.parse(rawValue);
	if (!Number.isNaN(parsed)) {
		return parsed;
	}

	const maybeUnixSeconds = Number(rawValue);
	if (Number.isNaN(maybeUnixSeconds)) {
		return null;
	}

	return maybeUnixSeconds > 1e12 ? maybeUnixSeconds : maybeUnixSeconds * 1000;
};

const isAccessTokenNearExpiry = () => {
	if (typeof window === "undefined") return false;

	const expirationMs = parseExpirationMs(localStorage.getItem("expiration"));
	if (!expirationMs) return false;

	return expirationMs - Date.now() <= ACCESS_REFRESH_SKEW_MS;
};

const isRefreshTokenStillValid = () => {
	if (typeof window === "undefined") return true;

	const refreshExpirationMs = parseExpirationMs(
		localStorage.getItem("refresh_expiration"),
	);
	if (!refreshExpirationMs) return true;

	return refreshExpirationMs > Date.now();
};
