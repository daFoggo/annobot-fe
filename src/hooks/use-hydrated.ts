import { useEffect, useState } from "react";

/**
 * Hook kiểm tra trạng thái hydration trên client để tránh hydration mismatch
 * khi đọc dữ liệu persisted từ localStorage / cookies.
 */
export function useHydrated(): boolean {
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		setHydrated(true);
	}, []);

	return hydrated;
}
