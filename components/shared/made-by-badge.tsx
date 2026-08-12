import { Heart } from "lucide-react";

/**
 * Small, permanent attribution shown in the bottom-right corner of every
 * page. Kept subtle so it never competes with real product UI.
 */
export function MadeByBadge() {
  return (
    <div className="pointer-events-none fixed right-3 bottom-3 z-40 sm:right-4 sm:bottom-4">
      <span className="text-muted-foreground/70 bg-background/60 border-border/50 pointer-events-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] backdrop-blur-sm">
        Made by Mani
        <Heart className="size-3 fill-current text-rose-500" aria-hidden="true" />
      </span>
    </div>
  );
}
