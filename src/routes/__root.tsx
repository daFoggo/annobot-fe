/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: <idk> */

import { TanStackDevtools } from "@tanstack/react-devtools";
import {
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ErrorFallback, NotFound } from "@/components/common/error-pages";
import { QueryProvider } from "@/components/common/query-provider";
import { ThemeProvider } from "@/components/common/theme-provider";
import { ToasterProvider } from "@/components/common/toaster-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE_CONFIG } from "@/configs/site";
import { getThemeServerFn, storageKey } from "@/lib/theme";
import type { IRouterContext } from "@/router";
import appCss from "../styles.css?url";

const RootDocument = ({ children }: { children: React.ReactNode }) => {
	const theme = Route.useLoaderData();
	const { queryClient } = Route.useRouteContext();

	const initialThemeScript = `
		(() => {
			try {
				const cookieKey = ${JSON.stringify(storageKey)};
				const cookie = document.cookie.split('; ').find((row) => row.startsWith(cookieKey + '='));
				const storedTheme = cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : 'system';
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				const resolvedTheme = storedTheme === 'system' ? (prefersDark ? 'dark' : 'light') : storedTheme;
				const root = document.documentElement;
				root.classList.remove('light', 'dark');
				root.classList.add(resolvedTheme);
			} catch (error) {
				console.warn("[theme] Failed to apply initial theme from cookie:", error);
			}
		})();
	`;

	return (
		<html
			lang="en"
			className={theme === "dark" ? "dark" : "light"}
			suppressHydrationWarning
		>
			<head>
				<script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
				<HeadContent />
			</head>
			<body suppressHydrationWarning>
				<QueryProvider client={queryClient}>
					<ThemeProvider theme={theme}>
						<TooltipProvider>
							{children}
							<ToasterProvider />
						</TooltipProvider>
					</ThemeProvider>
				</QueryProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
};

export const Route = createRootRouteWithContext<IRouterContext>()({
	head: () => {
		const title = SITE_CONFIG.metadata.title;
		const description = SITE_CONFIG.metadata.description;
		const url = SITE_CONFIG.app.url;
		const ogImage = SITE_CONFIG.app.ogImage;

		return {
			meta: [
				{ charSet: "utf-8" },
				{
					name: "viewport",
					content: "width=device-width, initial-scale=1",
				},
				{ title },
				{ name: "description", content: description },
				{ name: "keywords", content: SITE_CONFIG.metadata.keywords.join(", ") },
				// Open Graph
				{ property: "og:site_name", content: SITE_CONFIG.app.title },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:type", content: "website" },
				{ property: "og:url", content: url },
				{ property: "og:image", content: ogImage },
				// Twitter Card
				{ name: "twitter:card", content: "summary_large_image" },
				{ name: "twitter:title", content: title },
				{ name: "twitter:description", content: description },
				{ name: "twitter:image", content: ogImage },
			],
			links: [
				{ rel: "stylesheet", href: appCss },
				{ rel: "canonical", href: url },
				{ rel: "icon", href: "/favicon.ico", sizes: "any" },
				{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
				{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
				{ rel: "manifest", href: "/manifest.json" },
			],
		};
	},
	loader: () => getThemeServerFn(),
	shellComponent: RootDocument,
	notFoundComponent: NotFound,
	errorComponent: ErrorFallback,
});
