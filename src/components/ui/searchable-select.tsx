"use client";

import { type InputHTMLAttributes, useEffect, useMemo, useRef, useState } from "react";

interface SearchableOption {
  value: string;
  label: string;
}

interface SearchableSelectProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  error?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchableSelect({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  disabled,
  ...props
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const filtered = useMemo(
    () =>
      query
        ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
        : options,
    [options, query],
  );

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-primary">{label}</label>
      )}
      <input
        ref={inputRef}
        type="text"
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => { if (!disabled) setOpen(true); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        className={`
          block w-full rounded-lg border px-3 py-2 text-sm cursor-pointer
          bg-[var(--theme-input-bg)] text-text-primary
          placeholder:text-text-muted transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          ${error ? "border-danger" : "border-border"}
          ${className}
        `}
        {...props}
      />
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-[var(--theme-input-bg)] shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-text-muted">No results found</div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-secondary transition-colors ${
                  opt.value === value ? "bg-primary-50 text-primary-700 font-medium" : "text-text-primary"
                }`}
                onMouseDown={() => {
                  onChange(opt.value);
                  setOpen(false);
                  inputRef.current?.blur();
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
