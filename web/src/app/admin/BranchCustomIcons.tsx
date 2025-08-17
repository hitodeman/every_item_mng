import * as React from "react";

export function EditIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', width: 40, height: 40 }}
      {...props}
    >
      <rect x="4" y="4" width="24" height="24" rx="4" />
      <path d="M22.5 9.5a2 2 0 1 1 2.83 2.83l-9.18 9.18a2 2 0 0 1-.85.5l-3.1.9a.5.5 0 0 1-.62-.62l.9-3.1a2 2 0 0 1 .5-.85l9.18-9.18Z" />
    </svg>
  );
}

export function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block', width: 40, height: 40 }}
      {...props}
    >
      <rect x="6" y="10" width="20" height="16" rx="3" />
      <path d="M13 6h6m-9 4h12" />
      <path d="M16 14v6" />
      <path d="M12 14v6" />
      <path d="M20 14v6" />
    </svg>
  );
}
