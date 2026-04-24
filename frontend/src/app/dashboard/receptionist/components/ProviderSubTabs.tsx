"use client";

import { cn } from "@/lib/utils";

interface ProviderCapacity {
  provider_id: string;
  name: string;
  current_load: number;
  max_capacity: number;
}

interface ProviderSubTabsProps {
  providers: ProviderCapacity[];
  activeProviderId: string;
  onSelect: (providerId: string) => void;
}

export function ProviderSubTabs({ providers, activeProviderId, onSelect }: ProviderSubTabsProps) {
  return (
    <div className="flex overflow-x-auto hidden-scrollbar border-b border-slate-200 bg-[#fdfdfd] pt-2 px-2">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "px-5 py-3 text-[13px] font-bold border-b-[3px] transition-colors whitespace-nowrap",
          activeProviderId === "all"
            ? "border-blue-600 text-blue-700"
            : "border-transparent text-slate-500 hover:text-slate-700"
        )}
      >
        All Providers
      </button>

      {providers.map((p) => {
        const percentage = Math.min(100, Math.max(0, (p.current_load / Math.max(1, p.max_capacity)) * 100));
        let badgeClass = "bg-emerald-100 text-emerald-700";
        if (percentage >= 100) badgeClass = "bg-red-100 text-red-700";
        else if (percentage >= 70) badgeClass = "bg-amber-100 text-amber-700";

        return (
          <button
            key={p.provider_id}
            onClick={() => onSelect(p.provider_id)}
            className={cn(
              "px-5 py-3 text-[13px] font-bold border-b-[3px] transition-colors whitespace-nowrap flex items-center gap-2",
              activeProviderId === p.provider_id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {p.name.split(" ")[0]} {/* Short name */}
            <span className={cn("px-1.5 py-0.5 rounded text-[10px]", badgeClass)}>
              {p.current_load}/{p.max_capacity}
            </span>
          </button>
        );
      })}
    </div>
  );
}
