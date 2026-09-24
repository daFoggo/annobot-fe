import {
	keepPreviousData,
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { listCasesFn, triggerDetectionFn } from "./functions";
import type { CaseListParams } from "./schemas";

/**
 * Một trang đủ lớn để timeline, funnel và thống kê nhìn được toàn cảnh.
 *
 * Overview, trang Cases và badge trên sidebar đều dùng đúng con số này nên
 * cùng một query key — TanStack Query dedupe, cả experiment detail chỉ tốn một
 * request cases thay vì bốn.
 */
export const CASES_OVERVIEW_PAGE_SIZE = 1000;

export const caseKeys = {
	all: ["cases"] as const,
	lists: () => [...caseKeys.all, "list"] as const,
	list: (params: CaseListParams) => [...caseKeys.lists(), params] as const,
};

/** Query options cho danh sách cases phân trang. */
export const caseListQueryOptions = (params: CaseListParams) =>
	queryOptions({
		queryKey: caseKeys.list(params),
		queryFn: () => listCasesFn({ data: params }),
		// Detection worker chạy mỗi 60 giây, nên dữ liệu mới nhất cũng chỉ đổi ở
		// nhịp đó. Giữ 30 giây để chuyển tab/trang không bắn lại request.
		staleTime: 30_000,
		placeholderData: keepPreviousData,
	});

/** Hook kích hoạt Cycle Detection on-demand (cho cả experiment hoặc 1 inquiry). */
export const useTriggerDetection = (experimentId: string) => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (inquiryId?: string) =>
			triggerDetectionFn({
				data: { experimentId, inquiryId },
			}),
		onSuccess: async (data) => {
			const count = data.cases_created ?? 0;
			toast.success(`Detection finished: ${count} cases processed.`);
			await queryClient.invalidateQueries({ queryKey: caseKeys.all });
		},
		onError: (error) => {
			toast.error(`Could not run detection: ${error.message}`);
		},
	});
};
