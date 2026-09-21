import { IconLogout } from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useDashboardShell } from "../dashboard-shell-context";

const getInitials = (name: string) =>
	name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("");

/**
 * Menu tài khoản dùng chung cho cả header desktop và mobile. Đọc user/sign-out
 * từ shell context nên không cần truyền props.
 */
export const DashboardUserMenu = () => {
	const {
		state: { user, isSigningOut },
		actions: { signOut },
	} = useDashboardShell();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="icon-sm"
						className="rounded-full"
						aria-label="Account"
					>
						<Avatar size="sm">
							{user.avatar_url ? (
								<AvatarImage src={user.avatar_url} alt={user.name} />
							) : null}
							<AvatarFallback>{getInitials(user.name)}</AvatarFallback>
						</Avatar>
					</Button>
				}
			/>
			<DropdownMenuContent align="end" className="w-auto min-w-48">
				<DropdownMenuGroup>
					<DropdownMenuLabel>
						<span className="block max-w-56 truncate text-sm font-medium text-foreground">
							{user.name}
						</span>
						{user.email ? (
							<span className="block max-w-56 truncate text-xs font-normal text-muted-foreground">
								{user.email}
							</span>
						) : null}
					</DropdownMenuLabel>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					variant="destructive"
					disabled={isSigningOut}
					onClick={signOut}
				>
					<IconLogout />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
