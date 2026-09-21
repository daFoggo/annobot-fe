import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type { TBaseResponse } from "@/types/api";
import type {
	Experiment,
	ExperimentCreateInput,
	ExperimentUpdateInput,
} from "./schemas";

/** `GET /experiments` — danh sách experiment của user hiện tại. */
export const listExperiments = async (): Promise<Experiment[]> => {
	const response = await api
		.get("experiments")
		.json<TBaseResponse<Experiment[]>>();
	return response.data;
};

/** `GET /experiments/{id}`. */
export const getExperiment = async (id: string): Promise<Experiment> => {
	const response = await api
		.get(`experiments/${id}`)
		.json<TBaseResponse<Experiment>>();
	return response.data;
};

/** `POST /experiments`. */
export const createExperiment = async (
	payload: ExperimentCreateInput,
): Promise<Experiment> => {
	const response = await api
		.post("experiments", { json: payload })
		.json<TBaseResponse<Experiment>>();
	return response.data;
};

/** `PATCH /experiments/{id}`. */
export const updateExperiment = async (
	id: string,
	payload: ExperimentUpdateInput,
): Promise<Experiment> => {
	const response = await api
		.patch(`experiments/${id}`, { json: payload })
		.json<TBaseResponse<Experiment>>();
	return response.data;
};

/** `DELETE /experiments/{id}`. */
export const deleteExperiment = async (id: string): Promise<void> => {
	await api.delete(`experiments/${id}`);
};
