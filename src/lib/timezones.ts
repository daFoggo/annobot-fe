const offsetCache = new Map<string, string>();

/** Current UTC offset label for a zone, e.g. "GMT+07:00". Cached per zone. */
const offsetLabel = (zone: string): string => {
	let label = offsetCache.get(zone);
	if (!label) {
		try {
			const parts = new Intl.DateTimeFormat("en", {
				timeZone: zone,
				timeZoneName: "longOffset",
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			}).formatToParts(new Date());
			label =
				parts.find((part) => part.type === "timeZoneName")?.value ?? "UTC";
		} catch {
			label = "UTC";
		}
		offsetCache.set(zone, label);
	}
	return label;
};

export interface TimezoneRegion {
	label: string;
	zones: { value: string; label: string }[];
}

const REGION_ORDER = [
	"Africa",
	"America",
	"Antarctica",
	"Arctic",
	"Asia",
	"Atlantic",
	"Australia",
	"Europe",
	"Indian",
	"Pacific",
	"Etc",
];

const REGION_LABELS: Record<string, string> = {
	Africa: "Africa",
	America: "Americas",
	Antarctica: "Antarctica",
	Arctic: "Arctic",
	Asia: "Asia",
	Atlantic: "Atlantic",
	Australia: "Australia",
	Europe: "Europe",
	Indian: "Indian Ocean",
	Pacific: "Pacific",
	Etc: "UTC & Fixed offsets",
};

let cached: TimezoneRegion[] | null = null;

/** All IANA zones grouped by region (with current UTC offset), plus the
 *  Default/Browser sentinels rendered separately by the picker. */
export const timezoneRegions = (): TimezoneRegion[] => {
	if (!cached) {
		const zones = Intl.supportedValuesOf("timeZone");
		const grouped = new Map<string, { value: string; label: string }[]>();
		for (const zone of zones) {
			const region = zone.includes("/") ? zone.split("/")[0] : "Etc";
			if (!grouped.has(region)) grouped.set(region, []);
			grouped.get(region)?.push({
				value: zone,
				label: `${zone} (${offsetLabel(zone)})`,
			});
		}
		cached = REGION_ORDER.filter((region) => grouped.has(region)).map(
			(region) => ({
				label: REGION_LABELS[region] ?? region,
				zones: grouped.get(region) ?? [],
			}),
		);
	}
	return cached;
};
