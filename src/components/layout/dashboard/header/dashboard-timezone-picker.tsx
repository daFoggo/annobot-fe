import { IconWorld } from "@tabler/icons-react";
import { useMemo } from "react";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { timezoneRegions } from "@/lib/timezones";
import { TZ_BROWSER, TZ_DEFAULT, useTimezoneStore } from "@/stores/timezone";

/**
 * Bộ chọn timezone toàn dashboard trên header (cạnh theme toggle). Mặc định
 * theo timezone của user profile; cho phép chọn browser zone hoặc bất kỳ zone
 * IANA nào, nhóm theo vùng địa lý. Presentation-only — không refetch dữ liệu.
 */
export const DashboardTimezonePicker = () => {
	const choice = useTimezoneStore((state) => state.choice);
	const setChoice = useTimezoneStore((state) => state.setChoice);
	const regions = timezoneRegions();

	// `items` cung cấp cho base-ui cách resolve label của value đang chọn
	// (SelectValue đọc từ store.items, không phải text của SelectItem).
	const items = useMemo(
		() => [
			{ value: TZ_DEFAULT, label: "Default" },
			{ value: TZ_BROWSER, label: "Browser timezone" },
			...regions.flatMap((region) => region.zones),
		],
		[regions],
	);

	return (
		<Select
			items={items}
			value={choice}
			onValueChange={(value) => {
				if (value != null) setChoice(value);
			}}
		>
			<SelectTrigger
				size="sm"
				className="max-w-44 text-xs text-muted-foreground hover:text-foreground"
				aria-label="Timezone"
			>
				<IconWorld className="size-4 shrink-0" />
				<SelectValue placeholder="Timezone" />
			</SelectTrigger>
			<SelectContent className="w-64 no-scrollbar max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))]">
				<SelectGroup>
					<SelectLabel>General</SelectLabel>
					<SelectItem value={TZ_DEFAULT}>Default</SelectItem>
					<SelectItem value={TZ_BROWSER}>Browser timezone</SelectItem>
				</SelectGroup>
				{regions.map((region) => (
					<SelectGroup key={region.label}>
						<SelectLabel>{region.label}</SelectLabel>
						{region.zones.map((zone) => (
							<SelectItem key={zone.value} value={zone.value}>
								{zone.label}
							</SelectItem>
						))}
					</SelectGroup>
				))}
			</SelectContent>
		</Select>
	);
};
