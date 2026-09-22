import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type {
	Experiment,
	ExperimentCreateInput,
	ExperimentFindResult,
	ExperimentListParams,
	ExperimentUpdateInput,
} from "./schemas";

/** `GET /experiments` — danh sách phân trang experiment của user hiện tại. */
export const listExperiments = async (
	params?: ExperimentListParams,
): Promise<ExperimentFindResult> => {
	const searchParams = new URLSearchParams();
	if (params?.page != null) searchParams.set("page", String(params.page));
	if (params?.page_size != null)
		searchParams.set("page_size", String(params.page_size));

	return api.get("experiments", { searchParams }).json<ExperimentFindResult>();
};

/** `GET /experiments/{id}`. */
export const getExperiment = async (id: string): Promise<Experiment> =>
	api.get(`experiments/${id}`).json<Experiment>();

/** `POST /experiments`. */
export const createExperiment = async (
	payload: ExperimentCreateInput,
): Promise<Experiment> =>
	api.post("experiments", { json: payload }).json<Experiment>();

/** `PATCH /experiments/{id}`. */
export const updateExperiment = async (
	id: string,
	payload: ExperimentUpdateInput,
): Promise<Experiment> =>
	api.patch(`experiments/${id}`, { json: payload }).json<Experiment>();

/** `DELETE /experiments/{id}`. */
export const deleteExperiment = async (id: string): Promise<void> => {
	await api.delete(`experiments/${id}`);
};
