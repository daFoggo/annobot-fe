import { useSession } from "@tanstack/react-start/server";

export type SessionData = {
	access_token?: string;
	refresh_token?: string;
};

/**
 * Hook (chỉ dùng phía Server) quản lý phiên đăng nhập qua HTTP-only cookie.
 * Lưu access_token/refresh_token để ky instance gắn Bearer header khi gọi backend.
 */
export const useAppSession = async () => {
	return useSession<SessionData>({
		name: "anno_bot_session",
		password:
			process.env.SESSION_SECRET ||
			"default_development_secret_key_long_enough",
		cookie: {
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			httpOnly: true,
			maxAge: 60 * 60 * 24 * 7, // 7 ngày
		},
	});
};
