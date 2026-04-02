import React from "react";

interface JsonDiffViewerProps {
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
}

export function JsonDiffViewer({ oldValues, newValues }: JsonDiffViewerProps) {
  // If neither exist, nothing to show
  if (!oldValues && !newValues) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-500 font-medium italic text-center">
        No state payload attached to this event.
      </div>
    );
  }

  const oldJson = oldValues ? JSON.stringify(oldValues, null, 2) : "";
  const newJson = newValues ? JSON.stringify(newValues, null, 2) : "";

  // For a basic MVP, we will render side by side. 
  // In a full implementation, you might use a library like react-diff-viewer.
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      {/* Old Values */}
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-red-900/30">
        <div className="bg-[#2D2D2D] px-4 py-2 border-b border-red-500/20 flex justify-between items-center">
          <span className="text-xs font-bold font-mono text-red-400">old_values.json</span>
          {oldValues === null && <span className="text-xs text-slate-500 italic">Empty</span>}
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-[13px] font-mono text-red-300 leading-relaxed">
            {oldJson || "{}"}
          </pre>
        </div>
      </div>

      {/* New Values */}
      <div className="bg-[#1E1E1E] rounded-xl overflow-hidden border border-green-900/30">
        <div className="bg-[#2D2D2D] px-4 py-2 border-b border-green-500/20 flex justify-between items-center">
          <span className="text-xs font-bold font-mono text-green-400">new_values.json</span>
          {newValues === null && <span className="text-xs text-slate-500 italic">Empty</span>}
        </div>
        <div className="p-4 overflow-x-auto">
          <pre className="text-[13px] font-mono text-green-300 leading-relaxed">
            {newJson || "{}"}
          </pre>
        </div>
      </div>
    </div>
  );
}
