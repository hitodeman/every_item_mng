import * as React from "react";
export function Label({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium mb-1 ${className}`}>{children}</label>;
}
