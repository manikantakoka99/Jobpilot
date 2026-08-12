import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";

export function Sidebar() {
  return (
    <aside className="border-border/60 bg-card/40 hidden w-64 shrink-0 flex-col border-r lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <SidebarNav />
      </div>
      <div className="border-border/60 border-t p-4">
        <p className="text-muted-foreground/70 text-xs leading-relaxed">
          More tools are on the way. We&apos;ll let you know as they ship.
        </p>
      </div>
    </aside>
  );
}
