import { createFileRoute, redirect } from "@tanstack/react-router";

/** Trang chủ dashboard → danh sách experiment (thực thể cấp cao nhất). */
export const Route = createFileRoute("/_dashboard/dashboard/")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/experiments" });
	},
});
