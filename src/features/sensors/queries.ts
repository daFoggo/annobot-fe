import { queryOptions } from "@tanstack/react-query";
import { listDevicesFn, listSensorsFn } from "./functions";

export const sensorKeys = {
	all: ["sensors"] as const,
	lists: () => [...sensorKeys.all, "list"] as const,
};

export const deviceKeys = {
	all: ["devices"] as const,
	lists: () => [...deviceKeys.all, "list"] as const,
};

/** Query options cho danh sách cảm biến. */
export const sensorListQueryOptions = () =>
	queryOptions({
		queryKey: sensorKeys.lists(),
		queryFn: () => listSensorsFn(),
	});

/** Query options cho danh sách thiết bị vật lý gộp từ server. */
export const deviceListQueryOptions = () =>
	queryOptions({
		queryKey: deviceKeys.lists(),
		queryFn: () => listDevicesFn(),
	});
