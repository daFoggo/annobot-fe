import "@tanstack/react-start/server-only";

import { api } from "@/lib/ky";
import type { Device, Sensor } from "./schemas";

/** `GET /sensors` — danh sách cảm biến active của hệ thống. */
export const listSensors = async (): Promise<Sensor[]> =>
	api.get("sensors").json<Sensor[]>();

/** `GET /devices` — danh sách thiết bị vật lý gộp từ các cảm biến. */
export const listDevices = async (): Promise<Device[]> =>
	api.get("devices").json<Device[]>();
