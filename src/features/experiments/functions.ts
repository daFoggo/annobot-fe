import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { requestLoggerMiddleware } from "@/lib/middleware";
import { ExperimentCreateSchema, ExperimentUpdateSchema } from "./schemas";
import {
	createExperiment,
	deleteExperiment,
	getExperiment,
	listExperiments,
	updateExperiment,
} from "./server";

export const listExperimentsFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.handler(() => listExperiments());

export const getExperimentFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.validator(z.string())
	.handler(({ data: id }) => getExperiment(id));

export const createExperimentFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(ExperimentCreateSchema)
	.handler(({ data }) => createExperiment(data));

export const updateExperimentFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(z.object({ id: z.string(), payload: ExperimentUpdateSchema }))
	.handler(({ data }) => updateExperiment(data.id, data.payload));

export const deleteExperimentFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(z.string())
	.handler(({ data: id }) => deleteExperiment(id));
