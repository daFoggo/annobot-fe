import { useEffect, useState } from "react";

const formatRelative = (iso: string): string => {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return "—";
	const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
	if (seconds < 45) return "just now";
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.round(hours / 24)}d ago`;
};

export interface RelativeTimeProps {
	value: string | null;
	fallback?: string;
}

/**
 * Relative timestamp that is SSR-safe: the server (and the first client
 * render) print the raw UTC clock from the ISO string — deterministic on both
 * sides — then an effect swaps in the "5m ago" label after hydration.
 */
export const RelativeTime = ({ value, fallback = "—" }: RelativeTimeProps) => {
	const [label, setLabel] = useState(() =>
		value ? value.slice(11, 16) : fallback,
	);

	useEffect(() => {
		if (!value) return;
		const update = () => setLabel(formatRelative(value));
		update();
		const timer = window.setInterval(update, 60_000);
		return () => window.clearInterval(timer);
	}, [value]);

	return <span>{label}</span>;
};
