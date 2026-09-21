import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import {
	createExperimentFn,
	deleteExperimentFn,
	getExperimentFn,
	listExperimentsFn,
	updateExperimentFn,
} from "./functions";
import type { ExperimentCreateInput, ExperimentUpdateInput } from "./schemas";

export const experimentKeys = {
	all: ["experiments"] as const,
	lists: () => [...experimentKeys.all, "list"] as const,
	details: () => [...experimentKeys.all, "detail"] as const,
	detail: (id: string) => [...experimentKeys.details(), id] as const,
};

/** Query options cho danh sách experiment. */
export const experimentListQueryOptions = () =>
	queryOptions({
		queryKey: experimentKeys.lists(),
		queryFn: () => listExperimentsFn(),
	});

/** Query options cho một experiment theo id. */
export const experimentDetailQueryOptions = (id: string) =>
	queryOptions({
		queryKey: experimentKeys.detail(id),
		queryFn: () => getExperimentFn({ data: id }),
	});

export const useCreateExperiment = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: ExperimentCreateInput) =>
			createExperimentFn({ data: input }),
		onSuccess: async (experiment) => {
			queryClient.setQueryData(
				experimentKeys.detail(experiment.id),
				experiment,
			);
			await queryClient.invalidateQueries({
				queryKey: experimentKeys.lists(),
			});
		},
	});
};

export const useUpdateExperiment = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: { id: string; payload: ExperimentUpdateInput }) =>
			updateExperimentFn({ data: variables }),
		onSuccess: async (experiment) => {
			queryClient.setQueryData(
				experimentKeys.detail(experiment.id),
				experiment,
			);
			await queryClient.invalidateQueries({
				queryKey: experimentKeys.lists(),
			});
		},
	});
};

export const useDeleteExperiment = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteExperimentFn({ data: id }),
		onSuccess: async (_data, id) => {
			queryClient.removeQueries({ queryKey: experimentKeys.detail(id) });
			await queryClient.invalidateQueries({
				queryKey: experimentKeys.lists(),
			});
		},
	});
};
