import { useState } from "react";

interface Props {
  teamName: string;
}

// Dismissible success banner shown at the top of the team page after joining via invite.
// Rendered server-side when ?joined=1 is in the URL; dismissed client-side on X click.
export function WelcomeBanner({ teamName }: Props) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 mb-5 text-sm font-medium"
      style={{
        background: "oklch(0.97 0.04 145 / 1)",
        border: "1.4px solid oklch(0.82 0.10 145 / 1)",
        color: "oklch(0.38 0.12 145 / 1)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>
          Welcome to <strong>{teamName}</strong>! You've been added to the roster.
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
