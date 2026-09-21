import { Toaster } from "sonner";
import { useTheme } from "../theme-provider";

/**
 * Quản lý việc hiển thị các thông báo nhanh (toast notifications) cho ứng dụng.
 * Tự động đồng bộ hóa giao diện (theme) của thông báo với trạng thái Light/Dark mode hiện tại.
 */
export const ToasterProvider = () => {
	const { resolvedTheme } = useTheme();

	return (
		<Toaster
			richColors
			closeButton
			theme={resolvedTheme}
			position="top-right"
		/>
	);
};
