import React from "react";
import { ChevronDown, Calendar as CalendarIcon } from "lucide-react";

interface PageHeaderProps {
  breadcrumbs: string[];
  title: string;
  description?: string;
  actionContent?: React.ReactNode;
}

export function PageHeader({ breadcrumbs, title, description, actionContent }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 space-x-2">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb}>
              <span className={index === breadcrumbs.length - 1 ? "text-indigo-600" : ""}>
                {crumb}
              </span>
              {index < breadcrumbs.length - 1 && <span className="text-slate-200">/</span>}
            </React.Fragment>
          ))}
        </div>
        <h1 className="text-2xl sm:text-[32px] font-black text-slate-900 tracking-tight leading-none mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
      
      {/* Optional Top Right Action */}
      <div className="flex-shrink-0">
        {actionContent}
      </div>
    </div>
  );
}
