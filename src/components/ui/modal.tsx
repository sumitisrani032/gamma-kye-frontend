"use client";

import { type ReactNode, useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function Modal({ open, onClose, onConfirm, title, children, confirmLabel = "Confirm", cancelLabel = "Cancel", loading }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <div className="mt-2 text-sm text-text-secondary">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary hover:bg-surface-secondary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
