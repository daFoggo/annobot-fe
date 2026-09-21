import { createMiddleware } from "@tanstack/react-start";

/**
 * Middleware ghi log cho các Server Functions trong môi trường development.
 * Theo dõi thời gian thực thi và lỗi của các yêu cầu server-side.
 */
export const requestLoggerMiddleware = createMiddleware({
	type: "function",
}).server(async ({ method, serverFnMeta, next }) => {
	const startTime = Date.now();
	const isDev = process.env.NODE_ENV === "development";
	const label = `${serverFnMeta.name} (${serverFnMeta.filename})`;

	if (isDev) {
		console.log(`[SERVER-FN] 🚀 START: ${method} ${label}`);
	}

	try {
		const result = await next();

		if (isDev) {
			console.log(
				`[SERVER-FN] ✅ DONE: ${method} ${label} (${Date.now() - startTime}ms)`,
			);
		}

		return result;
	} catch (error) {
		console.error(
			`[SERVER-FN] ❌ ERROR: ${method} ${label} after ${Date.now() - startTime}ms:`,
			error,
		);
		throw error;
	}
});

/**
 * Middleware quản lý xác thực cho các Server Functions.
 * Trích xuất access token từ session và truyền vào context.
 */
export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const { useAppSession } = await import("./session.server");
		const session = await useAppSession();
		const token = session.data.access_token;

		return next({
			context: {
				token,
			},
		});
	},
);
