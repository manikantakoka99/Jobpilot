import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  className?: string;
}

export function scoreTone(score: number): { ring: string; text: string; label: string } {
  if (score >= 80) return { ring: "stroke-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "Strong match" };
  if (score >= 60) return { ring: "stroke-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Moderate match" };
  return { ring: "stroke-destructive", text: "text-destructive", label: "Needs work" };
}

/** Circular 0-100 score indicator, drawn with a plain SVG ring (no charting library needed). */
export function ScoreGauge({ score, size = 132, className }: ScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const tone = scoreTone(clamped);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={11} className="stroke-muted fill-none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={11}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("fill-none transition-[stroke-dashoffset] duration-700 ease-out", tone.ring)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold tracking-tight", tone.text)}>{clamped}</span>
        <span className="text-muted-foreground text-xs">/ 100</span>
      </div>
    </div>
  );
}
