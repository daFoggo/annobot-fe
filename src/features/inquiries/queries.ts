import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createInquiryFn,
	deleteInquiryFn,
	listInquiriesFn,
	updateInquiryFn,
} from "./functions";
import type { InquiryCreateInput, InquiryUpdateInput } from "./schemas";

export const inquiryKeys = {
	all: ["inquiries"] as const,
	lists: () => [...inquiryKeys.all, "list"] as const,
	byExperiment: (experimentId: string) =>
		[...inquiryKeys.lists(), experimentId] as const,
	details: () => [...inquiryKeys.all, "detail"] as const,
	detail: (id: string) => [...inquiryKeys.details(), id] as const,
};

/** Query options cho danh sách inquiry của một experiment. */
export const inquiryListQueryOptions = (experimentId: string) =>
	queryOptions({
		queryKey: inquiryKeys.byExperiment(experimentId),
		queryFn: () => listInquiriesFn({ data: experimentId }),
	});

export const useCreateInquiry = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: InquiryCreateInput) => createInquiryFn({ data: input }),
		onSuccess: async (inquiry) => {
			queryClient.setQueryData(inquiryKeys.detail(inquiry.id), inquiry);
			await queryClient.invalidateQueries({
				queryKey: inquiryKeys.byExperiment(inquiry.experiment_id),
			});
		},
	});
};

export const useUpdateInquiry = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: { id: string; payload: InquiryUpdateInput }) =>
			updateInquiryFn({ data: variables }),
		onSuccess: async (inquiry) => {
			queryClient.setQueryData(inquiryKeys.detail(inquiry.id), inquiry);
			await queryClient.invalidateQueries({
				queryKey: inquiryKeys.byExperiment(inquiry.experiment_id),
			});
		},
	});
};

export const useDeleteInquiry = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteInquiryFn({ data: id }),
		onSuccess: async (_data, id) => {
			queryClient.removeQueries({ queryKey: inquiryKeys.detail(id) });
			await queryClient.invalidateQueries({
				queryKey: inquiryKeys.lists(),
			});
		},
	});
};
