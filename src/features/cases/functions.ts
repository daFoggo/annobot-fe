import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { requestLoggerMiddleware } from "@/lib/middleware";
import { CaseListParamsSchema } from "./schemas";
import { listCases, triggerDetection } from "./server";

export const listCasesFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.validator(CaseListParamsSchema)
	.handler(({ data }) => listCases(data));

export const triggerDetectionFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(
		z.object({
			experimentId: z.string(),
			inquiryId: z.string().optional(),
		}),
	)
	.handler(({ data }) => triggerDetection(data.experimentId, data.inquiryId));
