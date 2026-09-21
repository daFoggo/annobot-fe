import { useEffect, useRef, useState } from "react";

export const useElementSize = <T extends HTMLElement>() => {
	const ref = useRef<T>(null);
	const [size, setSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		const measure = () =>
			setSize((prev) => {
				const width = el.clientWidth;
				const height = el.clientHeight;
				if (prev.width === width && prev.height === height) return prev;
				return { width, height };
			});
		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	return [ref, size] as const;
};
