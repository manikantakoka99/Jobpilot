"use client";

import { Badge } from "@/components/ui/badge";
import { ExpandableList } from "@/components/ats/expandable-list";

interface KeywordBadgeListProps {
  items: string[];
  /** "matched" renders a plain secondary badge; "missing" renders a destructive-outline badge. */
  tone: "matched" | "missing";
}

/**
 * Client-only wrapper around ExpandableList for a flat list of keyword
 * strings. Exists so the `renderItem` closure it needs is created here,
 * inside a Client Component, rather than being passed in as a function prop
 * from a Server Component (which React cannot serialize across the RSC
 * boundary) — see ResultView, which is a Server Component and only ever
 * passes this component plain string[] data.
 */
export function KeywordBadgeList({ items, tone }: KeywordBadgeListProps) {
  return (
    <ExpandableList
      items={items}
      renderItem={(keyword) =>
        tone === "matched" ? (
          <Badge key={keyword} variant="secondary">
            {keyword}
          </Badge>
        ) : (
          <Badge key={keyword} variant="outline" className="border-destructive/30 text-destructive">
            {keyword}
          </Badge>
        )
      }
    />
  );
}
