"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, User, Phone, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { patientsApi } from "@/lib/api/patients";
import { useDebounce } from "@/hooks/useDebounce";

interface Patient {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

interface PatientSearchInputProps {
  onSelect: (patient: Patient) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function PatientSearchInput({
  onSelect,
  onCreateNew,
  placeholder = "Search patient by name, phone, or email...",
  className,
  autoFocus = false,
}: PatientSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const fetchPatients = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await patientsApi.getPatients({
          search: debouncedQuery,
          is_active: true,
          page_size: 5,
        });
        if (response.success) {
          setResults(response.data || []);
        }
      } catch (error) {
        console.error("Failed to search patients:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoFocus={autoFocus}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 animate-spin" />
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[300px] overflow-y-auto">
            {results.length > 0 ? (
              <div className="py-2">
                <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Matches
                </div>
                {results.map((patient) => (
                  <button
                    key={patient.id}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col gap-1 border-l-2 border-transparent hover:border-blue-500"
                    onClick={() => {
                      onSelect(patient);
                      setIsOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="font-bold text-slate-900 text-sm">
                      {patient.name}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {patient.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </span>
                      )}
                      {patient.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {patient.email}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              !isLoading && (
                <div className="p-4 text-center text-sm text-slate-500">
                  No patients found matching "{query}"
                </div>
              )
            )}
          </div>
          
          {onCreateNew && (
            <div className="p-2 border-t border-slate-100 bg-slate-50">
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-100 transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  onCreateNew();
                }}
              >
                <Plus className="h-4 w-4" />
                Create New Patient
              </button>
            </div>
          )}
        </div>
      )}
      
      {isOpen && query.length > 0 && query.length < 2 && (
        <div className="absolute z-50 top-full mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-center text-sm text-slate-500 animate-in fade-in duration-200">
          Type at least 2 characters to search...
        </div>
      )}
    </div>
  );
}
