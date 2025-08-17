import * as React from "react";

export type BadgeProps = {
  variant?: "default" | "secondary" | "destructive" | "outline";
  className?: string;
  children: React.ReactNode;
};

export function Badge({ variant = "default", className = "", children }: BadgeProps) {
  let base = "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium min-w-[100px] w-fit whitespace-nowrap shrink-0 gap-1 transition overflow-hidden ";
  let color = "";
  switch (variant) {
    case "default":
      color = "bg-blue-600 text-white border-transparent";
      break;
    case "secondary":
      color = "bg-gray-200 text-gray-800 border-transparent";
      break;
    case "destructive":
      color = "bg-red-600 text-white border-transparent";
      break;
    case "outline":
      color = "bg-transparent text-gray-800 border-gray-300";
      break;
    default:
      color = "bg-blue-600 text-white border-transparent";
  }
  return (
    <span className={`${base} ${color} ${className}`}>{children}</span>
  );
}
