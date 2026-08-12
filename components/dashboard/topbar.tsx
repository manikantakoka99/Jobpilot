"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { UserMenu } from "@/components/dashboard/user-menu";
import { PAGE_TITLES } from "@/components/dashboard/nav-config";

interface TopbarProps {
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
}

export function Topbar({ fullName, email, avatarUrl }: TopbarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-sm sm:px-6">
      <MobileNav />
      <h1 className="flex-1 truncate text-lg font-semibold tracking-tight">{title}</h1>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications (coming soon)"
            className="text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-4.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Notifications — coming soon</TooltipContent>
      </Tooltip>

      <ThemeToggle />
      <UserMenu fullName={fullName} email={email} avatarUrl={avatarUrl} />
    </header>
  );
}
