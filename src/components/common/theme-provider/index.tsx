import type { PropsWithChildren } from "react";
import {
	createContext,
	use,
	useEffect,
	useRef,
	useState,
	useTransition,
} from "react";
import type { TTheme } from "@/lib/theme";
import { resolveTheme, setThemeServerFn } from "@/lib/theme";

type TResolvedTheme = "light" | "dark";

type TThemeContextVal = {
	theme: TTheme;
	resolvedTheme: TResolvedTheme;
	setTheme: (val: TTheme) => void;
	isPending: boolean;
};
type TThemeProviderProps = PropsWithChildren<{ theme?: TTheme }>;

const DEFAULT_THEME_CONTEXT: TThemeContextVal = {
	theme: "system",
	resolvedTheme: "light",
	setTheme: () => {},
	isPending: false,
};

const ThemeContext = createContext<TThemeContextVal>(DEFAULT_THEME_CONTEXT);

const prefersDark = () =>
	typeof window !== "undefined" &&
	window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyThemeClass = (resolvedTheme: TResolvedTheme) => {
	const root = window.document.documentElement;
	root.classList.remove("light", "dark");
	root.classList.add(resolvedTheme);
};

export const ThemeProvider = ({
	children,
	theme: initialTheme = "system",
}: TThemeProviderProps) => {
	const [theme, setThemeState] = useState<TTheme>(initialTheme);
	// On the server we can't match media, so "system" falls back to "light". On the
	// client during hydration we MUST match the server to avoid a mismatch; the inline
	// FOUC script in __root.tsx already set the right class, and effects below correct
	// the React state.
	const [resolvedTheme, setResolvedTheme] = useState<TResolvedTheme>(
		initialTheme === "dark" ? "dark" : "light",
	);
	const [isPending, startTransition] = useTransition();

	// Sync local state when the server-provided theme changes (initial hydration).
	useEffect(() => {
		setThemeState(initialTheme);
		setResolvedTheme(resolveTheme(initialTheme, prefersDark()));
	}, [initialTheme]);

	const isFirstClassSync = useRef(true);
	// Swap the <html> class whenever the resolved theme changes. Skip the first run:
	// the inline FOUC script already set the correct class before hydration.
	useEffect(() => {
		if (isFirstClassSync.current) {
			isFirstClassSync.current = false;
			return;
		}
		applyThemeClass(resolvedTheme);
	}, [resolvedTheme]);

	// When following the system theme, react to OS changes immediately.
	useEffect(() => {
		if (theme !== "system") return;

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const syncResolvedTheme = () =>
			setResolvedTheme(resolveTheme("system", mediaQuery.matches));

		syncResolvedTheme();
		mediaQuery.addEventListener("change", syncResolvedTheme);
		return () => mediaQuery.removeEventListener("change", syncResolvedTheme);
	}, [theme]);

	const setTheme = (val: TTheme) => {
		// Optimistic: update state + DOM class immediately so the swap feels instant.
		setThemeState(val);
		setResolvedTheme(resolveTheme(val, prefersDark()));

		// Persist to the server cookie in the background. No router invalidation:
		// re-running every route loader just for a theme change is expensive.
		startTransition(async () => {
			try {
				await setThemeServerFn({ data: val });
			} catch (error) {
				// Rollback if the server rejected the change.
				setThemeState(initialTheme);
				setResolvedTheme(resolveTheme(initialTheme, prefersDark()));
				console.error("Failed to sync theme to server:", error);
			}
		});
	};

	return (
		<ThemeContext value={{ theme, resolvedTheme, setTheme, isPending }}>
			{children}
		</ThemeContext>
	);
};

export const useTheme = () => use(ThemeContext);

export { ThemeToggle } from "./theme-toggle";
