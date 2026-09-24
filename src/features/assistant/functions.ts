import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { requestLoggerMiddleware } from "@/lib/middleware";
import {
	ListThreadsParamsSchema,
	OpenThreadRequestSchema,
	PostMessageRequestSchema,
} from "./schemas";
import {
	deferThread,
	getInbox,
	getThread,
	listMessages,
	listThreads,
	openThread,
	postMessage,
} from "./server";

export const getInboxFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.handler(() => getInbox());

export const listThreadsFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.validator(ListThreadsParamsSchema.optional())
	.handler(({ data }) => listThreads(data));

export const openThreadFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(OpenThreadRequestSchema)
	.handler(({ data }) => openThread(data));

export const getThreadFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.validator(z.string())
	.handler(({ data: threadId }) => getThread(threadId));

export const listMessagesFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.validator(z.string())
	.handler(({ data: threadId }) => listMessages(threadId));

export const postMessageFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(
		z.object({
			threadId: z.string(),
			payload: PostMessageRequestSchema,
		}),
	)
	.handler(({ data }) => postMessage(data.threadId, data.payload));

export const deferThreadFn = createServerFn({ method: "POST" })
	.middleware([requestLoggerMiddleware])
	.validator(z.string())
	.handler(({ data: threadId }) => deferThread(threadId));
