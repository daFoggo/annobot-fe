import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { listCasesFn, triggerDetectionFn } from "./functions";
import type { CaseListParams } from "./schemas";

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
			toast.success(`Nhận diện chu kỳ hoàn tất: ${count} chu kỳ được xử lý.`);
			await queryClient.invalidateQueries({
				queryKey: caseKeys.all,
			});
		},
		onError: (error) => {
			toast.error(`Kích hoạt nhận diện thất bại: ${error.message}`);
		},
	});
};
