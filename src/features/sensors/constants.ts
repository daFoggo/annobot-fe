import {
	IconBolt,
	IconDeviceGamepad,
	IconDeviceSdCard,
	IconDoor,
	IconDroplet,
	IconDropletBolt,
	IconDropletFilled,
	IconFridge,
	IconMicrowave,
	IconPlug,
	IconSun,
	IconSunHigh,
	IconTemperature,
	IconTemperatureCelsius,
	IconWalk,
	IconWashMachine,
	IconWind,
} from "@tabler/icons-react";
import type { FC } from "react";

export type SensorIconComponent = FC<{ className?: string }>;

export interface SensorMeta {
	name: string;
	unit: string;
	sensor_type: string;
	icon: SensorIconComponent;
}

const SENSOR_METADATA: Record<string, SensorMeta> = {
	kitchen_dishwasher_power: {
		name: "Dishwasher Power",
		unit: "W",
		sensor_type: "power_meter",
		icon: IconWashMachine,
	},
	kitchen_fridge_power: {
		name: "Fridge",
		unit: "W",
		sensor_type: "power_meter",
		icon: IconFridge,
	},
	kitchen_microwave_power: {
		name: "Microwave",
		unit: "W",
		sensor_type: "power_meter",
		icon: IconMicrowave,
	},
	kitchen_temp: {
		name: "Temperature",
		unit: "°C",
		sensor_type: "temperature",
		icon: IconTemperatureCelsius,
	},
	kitchen_humidity: {
		name: "Humidity",
		unit: "%",
		sensor_type: "humidity",
		icon: IconDroplet,
	},
	kitchen_luminosity: {
		name: "Luminosity",
		unit: "lux",
		sensor_type: "luminosity",
		icon: IconSunHigh,
	},
	kitchen_motion: {
		name: "Motion",
		unit: "count",
		sensor_type: "motion",
		icon: IconWalk,
	},
	kitchen_wash_dishes: {
		name: "Wash Dishes",
		unit: "",
		sensor_type: "motion",
		icon: IconDropletBolt,
	},
};

const SENSOR_DEFAULT_META: SensorMeta = {
	name: "Unknown Sensor",
	unit: "",
	sensor_type: "power_meter",
	icon: IconWashMachine,
};

const SENSOR_TYPE_ICONS: Record<string, SensorIconComponent> = {
	power_meter: IconBolt,
	plug_meter: IconPlug,
	water_flow: IconDroplet,
	motion: IconDeviceGamepad,
	temperature: IconTemperature,
	co2: IconWind,
	humidity: IconDropletFilled,
	contact: IconDeviceSdCard,
	door: IconDoor,
	luminosity: IconSun,
};

export function getSensorIcon(
	sourceKey: string,
	sensorType: string,
): SensorIconComponent {
	if (sourceKey in SENSOR_METADATA) {
		return SENSOR_METADATA[sourceKey].icon;
	}
	return SENSOR_TYPE_ICONS[sensorType] ?? IconBolt;
}

export function getSensorMeta(sourceKey: string): SensorMeta {
	return SENSOR_METADATA[sourceKey] ?? SENSOR_DEFAULT_META;
}
