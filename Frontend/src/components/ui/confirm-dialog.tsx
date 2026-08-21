"use client";

import { useState } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = true,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-3">
        <Button variant="outline" className="w-auto px-4" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          className={destructive ? "w-auto bg-red-600 px-4 hover:bg-red-700" : "w-auto px-4"}
          onClick={handleConfirm}
          loading={pending}
        >
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
