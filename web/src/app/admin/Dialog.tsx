import * as React from "react";
export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => onOpenChange(false)}>
      <div className="bg-white rounded shadow p-6 min-w-[320px]" onClick={e => e.stopPropagation()}>{children}</div>
    </div>
  );
}
export function DialogTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  return <>{children}</>;
}
export function DialogContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}
export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold mb-2">{children}</h2>;
}
