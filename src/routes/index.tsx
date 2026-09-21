import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Trang gốc điều hướng vào app. Việc kiểm tra đăng nhập nằm ở layout
 * `_dashboard` (beforeLoad → `/auth/sign-in`), nên ở đây chỉ cần chuyển hướng.
 */
export const Route = createFileRoute("/")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard" });
	},
});
