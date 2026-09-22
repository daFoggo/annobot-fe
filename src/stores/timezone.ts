import { create } from "zustand";

export const TZ_DEFAULT = "__default__";
export const TZ_BROWSER = "__browser__";

interface TimezoneState {
	choice: string;
	setChoice: (choice: string) => void;
}

/** Global dashboard timezone preference (Grafana-style). Not persisted: the
 *  default renders on the server so client hydration stays in sync. */
export const useTimezoneStore = create<TimezoneState>()((set) => ({
	choice: TZ_DEFAULT,
	setChoice: (choice) => set({ choice }),
}));

/** Resolve the effective IANA zone for the current choice. */
export const resolveTimezone = (choice: string, userTz: string): string => {
	if (choice === TZ_BROWSER) {
		return typeof window !== "undefined"
			? Intl.DateTimeFormat().resolvedOptions().timeZone
			: userTz;
	}
	if (choice === TZ_DEFAULT) return userTz;
	return choice;
};
