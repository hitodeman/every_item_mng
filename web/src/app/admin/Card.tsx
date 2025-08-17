import * as React from "react";

export function Card({ className = "", style = {}, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return <div className={`bg-white rounded-lg shadow border ${className}`} style={style}>{children}</div>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b px-6 py-4 flex flex-col gap-2">{children}</div>;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold leading-tight">{children}</h2>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="p-6">{children}</div>;
}
