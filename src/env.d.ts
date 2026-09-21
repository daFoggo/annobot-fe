/// <reference types="vite/client" />

interface ImportMetaEnv {
	// Client-side environment variables (prefixed with VITE_)
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_KEY: string;
	readonly VITE_API_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Server-side environment variables
declare global {
	namespace NodeJS {
		interface ProcessEnv {
			readonly NODE_ENV: "development" | "production" | "test";
		}
	}
}

export {};
