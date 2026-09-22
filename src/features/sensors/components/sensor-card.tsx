import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSensorIcon } from "../constants";
import type { Sensor } from "../schemas";

/**
 * Card nhỏ hiển thị một cảm biến: icon, tên, loại/đơn vị và zone (badge).
 * Dùng trong danh sách inquiry chi tiết và các vùng hiển thị sensors.
 */
export const SensorCard = ({
	sensor,
	className,
}: {
	sensor: Sensor;
	className?: string;
}) => {
	const Icon = getSensorIcon(sensor.source_key, sensor.sensor_type);

	return (
		<Card size="sm" className={cn("py-3", className)}>
			<CardContent className="flex items-center gap-3 px-3">
				<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
					<Icon className="size-4 text-muted-foreground" />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<span className="truncate text-sm font-medium">{sensor.name}</span>
					<span className="truncate text-xs text-muted-foreground">
						{sensor.sensor_type.replace("_", " ")}
						{sensor.unit ? ` · ${sensor.unit}` : ""}
					</span>
				</div>
				{sensor.zone ? (
					<Badge variant="secondary" className="shrink-0">
						{sensor.zone}
					</Badge>
				) : null}
			</CardContent>
		</Card>
	);
};
