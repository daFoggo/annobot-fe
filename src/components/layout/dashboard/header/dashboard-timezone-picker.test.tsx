import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { AuthUser } from "@/features/auth";
import { DashboardShellContext } from "../dashboard-shell-context";
import { DashboardTimezonePicker } from "./dashboard-timezone-picker";

afterEach(() => {
	cleanup();
});

const createMockShellContext = (user: AuthUser) => ({
	state: {
		user,
		isSigningOut: false,
		productMenu: undefined,
		isProductMenuSheetOpen: false,
		hasNav: false,
	},
	actions: {
		signOut: () => {},
		setProductMenuSheetOpen: () => {},
		openProductMenuSheet: () => {},
	},
});

const mockUserWithTz: AuthUser = {
	id: "user-1",
	name: "Test User",
	email: "test@example.com",
	timezone: "Asia/Ho_Chi_Minh",
};

const mockUserWithoutTz: AuthUser = {
	id: "user-2",
	name: "User No Tz",
	email: "notz@example.com",
};

describe("DashboardTimezonePicker", () => {
	it("renders user timezone with (Default) when user has timezone in profile", () => {
		render(
			<DashboardShellContext.Provider
				value={createMockShellContext(mockUserWithTz)}
			>
				<DashboardTimezonePicker />
			</DashboardShellContext.Provider>,
		);

		expect(screen.getByText("Asia/Ho_Chi_Minh (Default)")).toBeTruthy();
	});

	it("falls back to Default when user profile has no timezone", () => {
		render(
			<DashboardShellContext.Provider
				value={createMockShellContext(mockUserWithoutTz)}
			>
				<DashboardTimezonePicker />
			</DashboardShellContext.Provider>,
		);

		expect(screen.getByText("Default")).toBeTruthy();
	});

	it("falls back to Default when rendered outside of DashboardShell provider", () => {
		render(<DashboardTimezonePicker />);
		expect(screen.getByText("Default")).toBeTruthy();
	});
});
