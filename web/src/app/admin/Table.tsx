import * as React from "react";

export function Table({ children }: { children: React.ReactNode }) {
  return <table className="min-w-full divide-y divide-gray-200">{children}</table>;
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
}

export function TableRow({ children }: { children: React.ReactNode }) {
  return <tr className="hover:bg-zinc-100 transition-colors">{children}</tr>;
}

export function TableHead({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <th className={`px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}>{children}</th>;
}

export function TableCell({ className = "", style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return <td className={`px-4 py-2 whitespace-nowrap ${className}`} style={style}>{children}</td>;
}
