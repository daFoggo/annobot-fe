import { describe, expect, it } from "vitest";
import {
	AuthUserSchema,
	LoginInputSchema,
	SignInResponseSchema,
	SignUpInputSchema,
	TokenResponseSchema,
	UserInfoSchema,
} from "./schemas";

describe("Auth Schemas (anno-bot-merge backend)", () => {
	it("should validate UserInfo / AuthUser schema", () => {
		const valid = UserInfoSchema.safeParse({
			id: "user-123",
			name: "Jane Doe",
			email: "jane@example.com",
			profile_completed: true,
			timezone: "Asia/Ho_Chi_Minh",
		});
		expect(valid.success).toBe(true);

		// AuthUserSchema is an alias of UserInfoSchema
		const authUser = AuthUserSchema.safeParse({
			id: "user-123",
			name: "Jane Doe",
			email: null,
		});
		expect(authUser.success).toBe(true);
	});

	it("should validate login schema", () => {
		const valid = LoginInputSchema.safeParse({
			email: "test@example.com",
			password: "password123",
		});
		expect(valid.success).toBe(true);

		const invalidEmail = LoginInputSchema.safeParse({
			email: "invalid-email",
			password: "password123",
		});
		expect(invalidEmail.success).toBe(false);

		const shortPassword = LoginInputSchema.safeParse({
			email: "test@example.com",
			password: "123",
		});
		expect(shortPassword.success).toBe(false);
	});

	it("should validate sign-up schema with default timezone", () => {
		const valid = SignUpInputSchema.safeParse({
			email: "new@example.com",
			password: "password123",
			name: "Jane Doe",
		});
		expect(valid.success).toBe(true);
		if (valid.success) {
			expect(valid.data.timezone).toBeUndefined();
		}
	});

	it("should validate token response schema", () => {
		const valid = TokenResponseSchema.safeParse({
			access_token: "at-1",
			expiration: "2026-09-20T10:00:00Z",
			refresh_token: "rt-1",
			refresh_expiration: "2026-09-27T10:00:00Z",
		});
		expect(valid.success).toBe(true);
	});

	it("should validate sign-in response schema with user_info", () => {
		const valid = SignInResponseSchema.safeParse({
			access_token: "at-1",
			expiration: "2026-09-20T10:00:00Z",
			refresh_token: "rt-1",
			refresh_expiration: "2026-09-27T10:00:00Z",
			user_info: {
				id: "user-123",
				name: "Jane Doe",
			},
		});
		expect(valid.success).toBe(true);
	});
});
