"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExpandableListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  initialCount?: number;
  className?: string;
}

/** Renders a wrapped list of items, collapsing to `initialCount` with a "Show N more" toggle. */
export function ExpandableList<T>({ items, renderItem, initialCount = 12, className }: ExpandableListProps<T>) {
  const [expanded, setExpanded] = React.useState(false);
  const visible = expanded ? items : items.slice(0, initialCount);
  const hiddenCount = items.length - visible.length;

  return (
    <div>
      <div className={cn("flex flex-wrap gap-1.5", className)}>{visible.map(renderItem)}</div>
      {items.length > initialCount && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="mt-2 h-auto px-0 text-xs"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
        </Button>
      )}
    </div>
  );
}
