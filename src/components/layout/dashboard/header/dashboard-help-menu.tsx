import {
	IconBook,
	IconBrandGitlab,
	IconHelpCircle,
	IconMessage,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SITE_CONFIG } from "@/configs/site";

export const DashboardHelpMenu = () => (
	<DropdownMenu>
		<DropdownMenuTrigger
			render={
				<Button variant="ghost" size="icon-sm" aria-label="Help">
					<IconHelpCircle />
				</Button>
			}
		/>
		<DropdownMenuContent align="end" className="w-56">
			<DropdownMenuGroup>
				<DropdownMenuLabel>Need help?</DropdownMenuLabel>
			</DropdownMenuGroup>
			<DropdownMenuSeparator />
			<DropdownMenuItem
				render={
					<a href={SITE_CONFIG.app.github} target="_blank" rel="noreferrer" />
				}
			>
				<IconBrandGitlab />
				GitLab repository
			</DropdownMenuItem>
			<DropdownMenuItem
				render={
					<a
						href={`${SITE_CONFIG.app.github}#readme`}
						target="_blank"
						rel="noreferrer"
					/>
				}
			>
				<IconBook />
				Documentation
			</DropdownMenuItem>
			<DropdownMenuItem
				render={
					<a
						href={`${SITE_CONFIG.app.github}/issues/new`}
						target="_blank"
						rel="noreferrer"
					/>
				}
			>
				<IconMessage />
				Send feedback
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
);
