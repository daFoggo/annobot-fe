import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type {
	Experiment,
	ExperimentCreateInput,
	ExperimentUpdateInput,
} from "./schemas";

/** `GET /experiments` — danh sách experiment của user hiện tại. */
export const listExperiments = async (): Promise<Experiment[]> =>
	api.get("experiments").json<Experiment[]>();

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
