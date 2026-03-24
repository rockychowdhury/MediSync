import React from "react";
import { cn } from "@/lib/utils";
import MediSyncLogo from "./MediSyncLogo";

interface DataLoaderProps {
  /** Spinner size preset */
  size?: "sm" | "md" | "lg";
  /** Optional loading text */
  text?: string;
  /** Additional className */
  className?: string;
  /** Center the loader in its container */
  center?: boolean;
}

const sizeMap = {
  sm: 24,
  md: 36,
  lg: 52,
} as const;

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
} as const;

/**
 * DataLoader — Lightweight inline spinner for data-fetching states
 *
 * Uses the MediSync outer gear ring with a smooth rotation.
 * Pure CSS animation (transform: rotate), GPU-accelerated.
 * Minimal DOM footprint for dashboard performance.
 */
export default function DataLoader({
  size = "md",
  text,
  className,
  center = true,
}: DataLoaderProps) {
  return (
    <div
      className={cn(
        "data-loader inline-flex items-center gap-2",
        center && "justify-center w-full py-8",
        className
      )}
      role="status"
      aria-label={text || "Loading"}
    >
      <div
        className="data-loader__spinner"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          animation: "medisync-spin 1.2s linear infinite",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      >
        <MediSyncLogo size={sizeMap[size]} ringOnly />
      </div>
      {text && (
        <span
          className={cn(
            "text-muted-foreground font-medium",
            textSizeMap[size]
          )}
        >
          {text}
        </span>
      )}
      <span className="sr-only">Loading</span>
    </div>
  );
}
