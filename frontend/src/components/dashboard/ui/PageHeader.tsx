import React from "react";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";

interface PageHeaderProps {
  breadcrumbs: string[];
  title: string;
  actionContent?: React.ReactNode;
}

export function PageHeader({ breadcrumbs, title, actionContent }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
      <div>
        <div className="flex items-center text-[13px] font-medium text-slate-400 mb-3 space-x-1">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb}>
              <span className={index === breadcrumbs.length - 1 ? "text-slate-800" : ""}>
                {crumb}
              </span>
              {index < breadcrumbs.length - 1 && <span>/</span>}
            </React.Fragment>
          ))}
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
      </div>
      
      {/* Optional Top Right Action (like the Date Picker in the image) */}
      <div className="flex-shrink-0">
        {actionContent ? actionContent : (
          <button className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-600 px-3.5 py-1.5 rounded-[10px] text-sm font-semibold shadow-sm hover:bg-slate-50 transition-colors">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <span>Last 7 days</span>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}
