import { IconSearch } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

export interface DashboardSearchTriggerProps {
	onClick?: () => void;
}

/**
 * Ô "Search..." trên header. Là một button (không phải input) vì nó mở command
 * palette, giống `CommandMenuTriggerInput` của Supabase Studio.
 */
export const DashboardSearchTrigger = ({
	onClick,
}: DashboardSearchTriggerProps) => (
	<Button
		variant="outline"
		size="sm"
		onClick={onClick}
		aria-label="Search"
		className="hidden min-w-40 justify-start text-muted-foreground md:flex"
	>
		<IconSearch />
		<span className="flex-1 text-left">Search...</span>
		<KbdGroup>
			<Kbd>Ctrl</Kbd>
			<Kbd>K</Kbd>
		</KbdGroup>
	</Button>
);
