"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = "Working…",
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  const [pending, setPending] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const pendingRef = useRef(false);
  const onCancelRef = useRef(onCancel);
  const onConfirmRef = useRef(onConfirm);
  const titleId = useId();
  const descriptionId = useId();

  onCancelRef.current = onCancel;
  onConfirmRef.current = onConfirm;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendingRef.current) onCancelRef.current();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleConfirm() {
    pendingRef.current = true;
    setPending(true);
    try {
      await onConfirmRef.current();
      onCancelRef.current();
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="shelfie-app shelfie-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pendingRef.current) onCancelRef.current();
      }}
    >
      <section
        className="shelfie-modal shelfie-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="shelfie-confirm-content">
          <div className="shelfie-confirm-icon" aria-hidden="true">
            <AlertTriangle />
          </div>
          <div className="min-w-0 space-y-2">
            <h2 id={titleId} className="text-xl font-semibold">{title}</h2>
            <p id={descriptionId} className="text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
          <button
            type="button"
            className="shelfie-modal-close ml-auto self-start"
            onClick={onCancelRef.current}
            disabled={pending}
            aria-label="Close confirmation"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="shelfie-confirm-actions">
          <Button ref={cancelButtonRef} type="button" variant="outline" onClick={onCancelRef.current} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={pending}>
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
