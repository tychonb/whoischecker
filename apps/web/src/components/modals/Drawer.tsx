import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { Button } from "../feedback/Button";

interface DrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/25 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-xl flex-col border-l border-white/60 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <Button onClick={onClose} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
