import { createServerFn } from "@tanstack/react-start";
import { requestLoggerMiddleware } from "@/lib/middleware";
import { listDevices, listSensors } from "./server";

export const listSensorsFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.handler(() => listSensors());

export const listDevicesFn = createServerFn({ method: "GET" })
	.middleware([requestLoggerMiddleware])
	.handler(() => listDevices());
