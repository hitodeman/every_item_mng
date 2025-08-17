import * as React from "react";
export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input className={`border rounded px-3 py-2 text-base outline-none focus:border-primary transition ${className}`} {...props} />
  );
}
