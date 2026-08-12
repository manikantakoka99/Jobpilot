"use client";

import { Badge } from "@/components/ui/badge";
import { ExpandableList } from "@/components/ats/expandable-list";
import type { MatchedSkill } from "@/lib/ats/types";

interface SkillBadgeListProps {
  items: MatchedSkill[];
  /** "found" renders a plain secondary badge; "missing" renders a destructive-outline badge. */
  tone: "found" | "missing";
}

/**
 * Client-only wrapper around ExpandableList for a list of matched skills.
 * Same reasoning as KeywordBadgeList: the `renderItem` closure is created
 * here, inside a Client Component, not passed down from the Server
 * Component (ResultView), which only ever hands this component plain
 * MatchedSkill[] data.
 */
export function SkillBadgeList({ items, tone }: SkillBadgeListProps) {
  return (
    <ExpandableList
      items={items}
      renderItem={(skill) =>
        tone === "found" ? (
          <Badge key={skill.name} variant="secondary">
            {skill.name}
          </Badge>
        ) : (
          <Badge key={skill.name} variant="outline" className="border-destructive/30 text-destructive">
            {skill.name}
          </Badge>
        )
      }
    />
  );
}
