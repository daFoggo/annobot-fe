import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { requestLoggerMiddleware } from "@/lib/middleware";
import { InquiryCreateSchema, InquiryUpdateSchema } from "./schemas";
import {
	createInquiry,
	deleteInquiry,
	listInquiries,
	updateInquiry,
} from "./server";

export const listInquiriesFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.validator(z.string())
	.handler(({ data: experimentId }) => listInquiries(experimentId));

export const createInquiryFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(InquiryCreateSchema)
	.handler(({ data }) => createInquiry(data));

export const updateInquiryFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(z.object({ id: z.string(), payload: InquiryUpdateSchema }))
	.handler(({ data }) => updateInquiry(data.id, data.payload));

export const deleteInquiryFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(z.string())
	.handler(({ data: id }) => deleteInquiry(id));
