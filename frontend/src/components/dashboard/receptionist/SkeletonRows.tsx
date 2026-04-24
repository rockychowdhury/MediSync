import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonRowsProps {
  rows?: number;
  columns?: number;
  className?: string;
  rowClassName?: string;
}

export function SkeletonRows({
  rows = 5,
  columns = 4,
  className,
  rowClassName,
}: SkeletonRowsProps) {
  return (
    <div className={cn("w-full animate-pulse", className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className={cn(
            "flex items-center py-4 border-b border-slate-100 last:border-0",
            rowClassName
          )}
        >
          {Array.from({ length: columns }).map((_, colIndex) => {
            // Randomize width somewhat to look more like real text, but keep it deterministic by colIndex
            const widths = ["w-1/4", "w-1/3", "w-1/2", "w-1/5", "w-1/6"];
            const widthClass = widths[colIndex % widths.length];
            
            return (
              <div
                key={colIndex}
                className={cn(
                  "h-4 bg-slate-100 rounded mr-6 last:mr-0",
                  widthClass
                )}
                style={{ flex: 1 }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
