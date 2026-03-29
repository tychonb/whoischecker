import type { ReactNode } from "react";

import { Button } from "../feedback/Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  intent?: "default" | "danger";
  children?: ReactNode;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Bevestigen",
  cancelLabel = "Annuleren",
  onConfirm,
  onClose,
  intent = "default",
  children,
}: ConfirmDialogProps) {
  return (
    <Modal description={description} onClose={onClose} open={open} title={title}>
      {children}
      <div className="mt-6 flex justify-end gap-3">
        <Button onClick={onClose} variant="secondary">
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} variant={intent === "danger" ? "danger" : "primary"}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
