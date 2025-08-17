import * as React from "react";
export function Button({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const defaultClass = "bg-primary text-white rounded px-4 py-2 font-medium flex items-center gap-2 hover:bg-primary/90 transition";
  return (
    <button className={`${defaultClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
