"use client";

interface FillLevelBarProps {
  value: number;
  label?: string;
  showLabel?: boolean;
}

function getGradient(value: number): string {
  if (value < 25) return "from-green-500 to-green-400";
  if (value < 50) return "from-yellow-500 to-yellow-400";
  if (value < 75) return "from-orange-500 to-orange-400";
  return "from-red-500 to-red-400";
}

export function FillLevelBar({
  value,
  label,
  showLabel = true,
}: FillLevelBarProps) {
  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getGradient(value)} transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
