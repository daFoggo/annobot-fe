import { useMatches } from "@tanstack/react-router";
import type { DashboardProductMenu } from "../types";

/**
 * Product menu của section hiện tại, lấy từ `staticData.productMenu` của route
 * match sâu nhất. Dùng `useMatches({ select })` để không re-render mỗi router tick.
 */
export const useProductMenu = (): DashboardProductMenu | undefined =>
	useMatches({
		select: (matches) => {
			for (let index = matches.length - 1; index >= 0; index -= 1) {
				const { productMenu } = matches[index].staticData;
				if (productMenu) return productMenu;
			}
			return undefined;
		},
	});
